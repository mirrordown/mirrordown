// markdown-it core internals (lib.ucmicro) are typed loose; the regex source casts are reviewed.
/* oxlint-disable typescript/no-unsafe-type-assertion */
// Forked and modified from https://github.com/markdown-it/markdown-it-abbr/blob/master/index.mjs

import type { PluginSimple } from "markdown-it";
import type { RuleBlock } from "markdown-it/lib/parser_block.mjs";
import type { RuleCore } from "markdown-it/lib/parser_core.mjs";
import type StateBlock from "markdown-it/lib/rules_block/state_block.mjs";
import type StateCore from "markdown-it/lib/rules_core/state_core.mjs";
import type Token from "markdown-it/lib/token.mjs";

interface AbbrStateBlock extends StateBlock {
  env: { abbreviations?: Record<string, string> };
}

interface AbbrStateCore extends StateCore {
  env: { abbreviations?: Record<string, string> };
}

const ESCAPE_RE = /\\(.)/g;

const isText = (token: Token): boolean =>
  token.type === "text" || token.type === "text_special";

const abbrDefinition: RuleBlock = (
  state: AbbrStateBlock,
  startLine,
  _endLine,
  silent
) => {
  let labelEnd = -1;
  let pos = state.bMarks[startLine] + state.tShift[startLine];
  const max = state.eMarks[startLine];

  if (
    pos + 2 >= max ||
    state.src.charCodeAt(pos++) !== 42 /* * */ ||
    state.src.charCodeAt(pos++) !== 91 /* [ */
  )
    return false;

  const labelStart = pos;

  while (pos < max) {
    const ch = state.src.charCodeAt(pos);
    if (ch === 91 /* [ */) return false;
    if (ch === 93 /* ] */) {
      labelEnd = pos;
      break;
    }
    if (ch === 92 /* \ */) pos++;
    pos++;
  }

  if (labelEnd < 0 || state.src.charCodeAt(labelEnd + 1) !== 58 /* : */)
    return false;

  const label = state.src
    .slice(labelStart, labelEnd)
    .replaceAll(ESCAPE_RE, "$1");

  pos = labelEnd + 2;
  const titleStart = state.skipSpaces(pos);
  const titleEnd = state.skipSpacesBack(max, titleStart);
  const title = state.src.slice(titleStart, titleEnd);

  if (label.length === 0 || title.length === 0) return false;
  // Asked only now: in silent mode the question is whether this line ends the paragraph above it, and a line with no term or no title is not a definition.
  if (silent) return true;

  // The `:` prefix, as in markdown-it-abbr, keeps a term from naming a member every object inherits: with `_`, the term `_proto__` became the key `__proto__` and was never stored.
  (state.env.abbreviations ??= {})[`:${label}`] ??= title;
  state.line = startLine + 1;

  return true;
};

/** markdown-it plugin for abbreviations (`*[term]: definition`), rendering `<abbr>` elements. */
export const abbr: PluginSimple = (md) => {
  const { escapeRE, lib } = md.utils;

  const OTHER_CHARS = " \r\n$+<=>^`|~";
  // oxlint-disable-next-line typescript/no-unsafe-member-access
  const UNICODE_PUNCTUATION_REGEXP = (lib.ucmicro.P as RegExp).source;
  // oxlint-disable-next-line typescript/no-unsafe-member-access
  const UNICODE_SPACE_REGEXP = (lib.ucmicro.Z as RegExp).source;
  const WORDING_REGEXP_TEXT = `${UNICODE_PUNCTUATION_REGEXP}|${UNICODE_SPACE_REGEXP}|[${OTHER_CHARS.split("").map(escapeRE).join("")}]`;

  const abbrReplace: RuleCore = (state: AbbrStateCore) => {
    const { tokens } = state;
    const { abbreviations } = state.env;

    // No terms means an empty alternation, which matches the empty string at the same place forever.
    if (!abbreviations || Object.keys(abbreviations).length === 0) return;

    const abbreviationsRegExpText = Object.keys(abbreviations)
      .map((item) => item.slice(1))
      .sort((a, b) => b.length - a.length)
      .map(escapeRE)
      .join("|");

    const regexpSimple = new RegExp(`(?:${abbreviationsRegExpText})`);
    const regExp = new RegExp(
      `(^|${WORDING_REGEXP_TEXT})(${abbreviationsRegExpText})($|${WORDING_REGEXP_TEXT})`,
      "g"
    );

    const tokensLength = tokens.length;

    for (let i = 0; i < tokensLength; i++) {
      const token = tokens[i];

      if (token.type !== "inline") continue;

      let children = token.children!;

      // Text is scanned a run at a time. Until `text_join`, which runs after this rule, an escaped character or a character reference is a `text_special` token of its own, and it is a character of the word around it, not the edge of the text.
      for (let index = children.length - 1; index >= 0; index--) {
        if (!isText(children[index])) continue;

        const end = index + 1;
        while (index > 0 && isText(children[index - 1])) index--;
        const run = children.slice(index, end);
        const text = run.map((child) => child.content).join("");
        regExp.lastIndex = 0;

        if (!regexpSimple.test(text)) continue;

        const nodes: Token[] = [];
        // The run's tokens over `from` to `to` of its text. A piece of a `text_special` token stays one, so the typographer, which runs later, still leaves an escaped character alone.
        const pushText = (from: number, to: number) => {
          let offset = 0;
          for (const child of run) {
            const start = Math.max(from, offset) - offset;
            const stop = Math.min(to, offset + child.content.length) - offset;
            offset += child.content.length;
            if (start >= stop) continue;
            const textToken = new state.Token(child.type, "", 0);
            textToken.content = child.content.slice(start, stop);
            textToken.info = child.info;
            textToken.markup = child.markup;
            nodes.push(textToken);
          }
        };
        let match: RegExpExecArray | null;
        let pos = 0;

        while ((match = regExp.exec(text))) {
          const [, before, word, after] = match;
          const wordStart = match.index + before.length;

          pushText(pos, wordStart);

          const abbrOpenToken = new state.Token("abbr_open", "abbr", 1);
          abbrOpenToken.attrPush(["title", abbreviations[`:${word}`]]);
          nodes.push(abbrOpenToken);

          pushText(wordStart, wordStart + word.length);

          const abbrCloseToken = new state.Token("abbr_close", "abbr", -1);
          nodes.push(abbrCloseToken);

          regExp.lastIndex -= after.length;
          pos = regExp.lastIndex;
        }

        if (nodes.length === 0) continue;

        pushText(pos, text.length);

        token.children = children = [
          ...children.slice(0, index),
          ...nodes,
          ...children.slice(end)
        ];
      }
    }
  };

  md.block.ruler.before("reference", "abbr_definition", abbrDefinition, {
    alt: ["paragraph", "reference"]
  });
  md.core.ruler.after("linkify", "abbr_replace", abbrReplace);
};
