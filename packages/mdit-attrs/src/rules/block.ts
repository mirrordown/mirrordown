import type { DelimiterConfig } from "../types.js";
import {
  addAttrs,
  dropEmptyTail,
  getDelimiterChecker,
  getMatchingOpeningToken
} from "../helper/index.js";
import type { AttrRule } from "./types.js";

// Token types that should not be treated as attr targets
const SKIP_TYPES = new Set([
  "code_inline",
  "math_inline",
  "fence",
  "code_block"
]);

// Opening tokens whose trailing block another rule reads.
const OWNED_TYPES = new Set(["heading_open", "td_open", "th_open"]);

export const createBlockRule = (options: DelimiterConfig): AttrRule => {
  const check = getDelimiterChecker(options.left, options.right);

  return {
    name: "block attributes",
    tests: [
      {
        shift: 0,
        type: "inline",
        children: [
          {
            index: -1,
            // Only literal text can end in an attribute block: an image's `content` is its alt text, a code span's is its code.
            type: "text",
            content: (content: string) => check(content.trim(), "end") !== null
          }
        ]
      }
    ],
    transform(tokens, index) {
      const inline = tokens[index];
      const children = inline.children!;
      const lastChild = children[children.length - 1];

      const content = lastChild.content.trimEnd();
      const range = check(content, "end")!;

      // Find the block-level opening token that contains this inline
      // Walk backwards: skip the paragraph_open immediately before, then
      // look for the outermost open that wraps this inline token.
      let openToken = null;

      // First: find the _close token that closes the block containing this inline
      // by walking forward from the inline's position
      let closeIdx = index + 1;
      while (closeIdx < tokens.length && tokens[closeIdx].nesting !== -1) {
        closeIdx++;
      }

      if (closeIdx < tokens.length) {
        openToken = getMatchingOpeningToken(tokens, closeIdx);
      }

      if (!openToken) return;
      if (SKIP_TYPES.has(openToken.type)) return;
      // Each place a block can end belongs to one rule, so that a rule name means the same with or without the others: a heading's end is the heading rule's, a table cell's the table rule's, and the end of a list item's first paragraph (or of a custom item's title) the list rule's. Read here, a block would go on a heading with `heading` turned off, or on the paragraph a tight list never renders, where it is lost.
      if (OWNED_TYPES.has(openToken.type)) return;
      const before = tokens[index - 1];
      if (
        before.meta?.attrsItemTitle === true ||
        (before.type === "paragraph_open" &&
          tokens[index - 2]?.type === "list_item_open")
      )
        return;

      addAttrs(openToken, content, range, options.allowed);

      // Strip the attr block from the last child's content
      const attrStart = content.lastIndexOf(options.left, range[0] - 1);
      lastChild.content = content.slice(0, attrStart).trimEnd();

      // Drop the child if now empty
      dropEmptyTail(children);
    }
  };
};
