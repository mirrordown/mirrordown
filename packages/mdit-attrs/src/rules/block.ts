import type { DelimiterConfig } from "../types.js";
import { addAttrs, getDelimiterChecker, getMatchingOpeningToken } from "../helper/index.js";
import type { AttrRule } from "./types.js";

// Token types that should not be treated as attr targets
const SKIP_TYPES = new Set(["code_inline", "math_inline", "fence", "code_block"]);

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
            type: (t: string) => !SKIP_TYPES.has(t),
            content: (content: string) => check(content.trim(), "end") !== null,
          },
        ],
      },
    ],
    transform(tokens, index) {
      const inline = tokens[index]!;
      const children = inline.children!;
      const lastChild = children[children.length - 1]!;

      const content = lastChild.content.trimEnd();
      const range = check(content, "end")!;

      // Find the block-level opening token that contains this inline
      // Walk backwards: skip the paragraph_open immediately before, then
      // look for the outermost open that wraps this inline token.
      let openToken = null;

      // First: find the _close token that closes the block containing this inline
      // by walking forward from the inline's position
      let closeIdx = index + 1;
      while (closeIdx < tokens.length && tokens[closeIdx]!.nesting !== -1) {
        closeIdx++;
      }

      if (closeIdx < tokens.length) {
        openToken = getMatchingOpeningToken(tokens, closeIdx);
      }

      if (!openToken) return;
      if (SKIP_TYPES.has(openToken.type)) return;

      addAttrs(openToken, content, range, options.allowed);

      // Strip the attr block from the last child's content
      const attrStart = content.lastIndexOf(options.left, range[0] - 1);
      lastChild.content = content.slice(0, attrStart).trimEnd();

      // Drop the child if now empty
      if (lastChild.content === "" && children.length > 1) {
        children.pop();
      }
    },
  };
};
