import type { PluginWithOptions } from "markdown-it";
import type Token from "markdown-it/lib/token.mjs";
import type { AttrsOptions, DelimiterRange } from "./types.js";
import { createRules } from "./rules/index.js";
import type { AttrDocument } from "./rules/types.js";
import { testRule } from "./helper/index.js";

/**
 * Joins a backslash that escapes nothing back into the text around it. markdown-it emits every backslash and the character after it as a `text_special` token, so the rules below see the text split there and read no block across it. For a real escape or a character reference that is the point: a block that holds one stays text. A backslash before anything but ASCII punctuation is two literal characters (`C:\dir`), which remark and Sätteri read as part of the block. markdown-it's own `text_join` does this joining later, for every such token.
 */
const joinLiteralBackslashes = (children: Token[]): Token[] => {
  const isLiteral = (child: Token): boolean =>
    child.type === "text_special" &&
    child.info === "escape" &&
    child.content === child.markup;
  if (!children.some(isLiteral)) return children;

  const joined: Token[] = [];
  // Whether the last token kept ends in a literal backslash pair, and so takes the text that follows it.
  let open = false;
  for (const child of children) {
    const previous = joined.at(-1);
    if (isLiteral(child)) {
      if (previous?.type === "text") {
        previous.content += child.content;
      } else {
        child.type = "text";
        joined.push(child);
      }
      open = true;
    } else if (open && child.type === "text" && previous) {
      previous.content += child.content;
      open = false;
    } else {
      joined.push(child);
      open = false;
    }
  }
  return joined;
};

/** The {@link AttrDocument} for one run of the rules over `tokens`, read from `src`. */
const readDocument = (src: string, tokens: Token[]): AttrDocument => {
  const split = new Map<string, string[]>();
  let parents: Map<Token, Token> | undefined;
  const removed = new Set<Token>();
  // For the last index of each run of removed tokens, the first index of the run, so that a step back crosses the run at once, however many blocks were removed in a row.
  const runStart = new Map<number, number>();
  return {
    src,
    lines(source) {
      let lines = split.get(source);
      if (!lines) {
        lines = source.split("\n");
        split.set(source, lines);
      }
      return lines;
    },
    parent(token) {
      if (!parents) {
        parents = new Map();
        // The open tokens that can still be a later token's parent, oldest first and each at a lower level than the next: an open token hides every earlier one at its level or deeper. The tokens the rules remove after this is built are paragraphs, whose only child, their inline, goes with them.
        const opens: Token[] = [];
        for (const t of tokens) {
          let at = opens.length - 1;
          while (at >= 0 && opens[at].level >= t.level) at--;
          if (at >= 0) parents.set(t, opens[at]);
          if (t.nesting === 1) {
            opens.length = at + 1;
            opens.push(t);
          }
        }
      }
      return parents.get(token);
    },
    remove(index, count) {
      for (let i = index; i < index + count; i++) removed.add(tokens[i]);
      const before = index - 1;
      const start =
        before >= 0 && removed.has(tokens[before])
          ? (runStart.get(before) ?? before)
          : index;
      runStart.set(index + count - 1, start);
    },
    removed(token) {
      return removed.has(token);
    },
    back(index, steps) {
      let at = index;
      for (let step = 0; step < steps && at >= 0; step++) {
        at--;
        while (at >= 0 && removed.has(tokens[at]))
          at = (runStart.get(at) ?? at) - 1;
      }
      return at;
    }
  };
};

/** markdown-it plugin for attribute lists (`{.class #id key=value}`) on elements. */
export const attrs: PluginWithOptions<AttrsOptions> = (
  md,
  { left = "{", right = "}", allowed = [], rule = "all" } = {}
) => {
  const rules = createRules(
    { left, right, allowed, rule },
    md.utils.unescapeAll
  );

  // A fence whose class slot the fence rule reserved renders as
  // `class=" language-x"`; drop the leading space.
  const renderFence = md.renderer.rules.fence;
  if (renderFence) {
    md.renderer.rules.fence = (tokens, idx, opts, env, self): string => {
      const html = renderFence(tokens, idx, opts, env, self);
      return tokens[idx].meta?.attrsReservedClass
        ? html.replace(' class=" ', ' class="')
        : html;
    };
  }

  // The token type a rule's first test demands of the current token, when it names one outright.
  // Every token is tried against every rule, and almost every rule anchors on an `inline` token, so
  // comparing that type first skips the full test run (with its result objects) for the opening and
  // closing tokens that make up most of the stream.
  const anchorTypes = rules.map(({ tests: [first] }) =>
    first.position === undefined &&
    (first.shift ?? 0) === 0 &&
    typeof first.type === "string"
      ? first.type
      : null
  );

  md.core.ruler.before("linkify", "attrs", (state) => {
    const { tokens } = state;
    if (rules.length === 0) return;

    for (const token of tokens) {
      if (token.children)
        token.children = joinLiteralBackslashes(token.children);
    }

    const doc = readDocument(state.src, tokens);
    for (let index = 0; index < tokens.length; index++) {
      const token = tokens[index];
      const tokenType = token.type;
      // A rule that removes a paragraph removes the token being read with it, and the rules after it have nothing left to read; the token after the paragraph is read in its turn, by every rule.
      for (
        let ruleIndex = 0;
        ruleIndex < rules.length && !doc.removed(token);
        ruleIndex++
      ) {
        const anchorType = anchorTypes[ruleIndex];
        if (anchorType !== null && anchorType !== tokenType) continue;
        const pattern = rules[ruleIndex];
        let position: number | null = null;
        let range: DelimiterRange | null = null;

        const match = pattern.tests.every((test) => {
          const result = testRule(tokens, index, test, doc);
          if (result.position != null) position = result.position;
          if (result.range) range = result.range;
          return result.match;
        });

        if (match) {
          const modified = pattern.transform(
            tokens,
            index,
            position!,
            range!,
            doc
          );

          if (
            modified !== false &&
            (pattern.name === "inline attributes" ||
              pattern.name === "inline nesting self-close")
          ) {
            ruleIndex--;
          }
        }
      }
    }

    // The removed paragraphs leave the stream together, in one pass: removing each as its rule read it moved every later token once per block.
    let kept = 0;
    for (const token of tokens) if (!doc.removed(token)) tokens[kept++] = token;
    tokens.length = kept;
  });
};
