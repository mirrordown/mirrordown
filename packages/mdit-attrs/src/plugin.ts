import type { PluginWithOptions } from "markdown-it";
import type Token from "markdown-it/lib/token.mjs";
import type { AttrsOptions, DelimiterRange } from "./types.js";
import { createRules } from "./rules/index.js";
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

/** markdown-it plugin for attribute lists (`{.class #id key=value}`) on elements. */
export const attrs: PluginWithOptions<AttrsOptions> = (
  md,
  { left = "{", right = "}", allowed = [], rule = "all" } = {}
) => {
  const rules = createRules({ left, right, allowed, rule });

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

    for (let index = 0; index < tokens.length; index++) {
      const tokenType = tokens[index].type;
      for (let ruleIndex = 0; ruleIndex < rules.length; ruleIndex++) {
        const anchorType = anchorTypes[ruleIndex];
        if (anchorType !== null && anchorType !== tokenType) continue;
        const pattern = rules[ruleIndex];
        let position: number | null = null;
        let range: DelimiterRange | null = null;

        const match = pattern.tests.every((test) => {
          const result = testRule(tokens, index, test);
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
            state.src
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
  });
};
