import type { DelimiterConfig } from "../types.js";
import { addAttrs, getDelimiterChecker } from "../helper/index.js";
import type { AttrRule } from "./types.js";

export const createHeadingRule = (options: DelimiterConfig): AttrRule => {
  const check = getDelimiterChecker(options.left, options.right);

  return {
    name: "heading attributes",
    tests: [
      {
        shift: 0,
        type: "heading_open",
      },
      {
        shift: 1,
        type: "inline",
        children: [
          {
            index: -1,
            type: (t: string) => t !== "code_inline" && t !== "math_inline",
            content: (content: string) => check(content.trim(), "end") !== null,
          },
        ],
      },
    ],
    transform(tokens, index) {
      const openToken = tokens[index]!;
      const inline = tokens[index + 1]!;
      const children = inline.children!;
      const lastChild = children[children.length - 1]!;

      const content = lastChild.content;
      const trimmed = content.trimEnd();
      const range = check(trimmed, "end")!;

      addAttrs(openToken, trimmed, range, options.allowed);

      // Strip the attr block from the last child content
      const before = trimmed.slice(0, trimmed.lastIndexOf(options.left, range[0] - 1));
      lastChild.content = before.trimEnd();

      // Drop the child entirely if it's now empty
      if (lastChild.content === "" && children.length > 1) {
        children.pop();
      }
    },
  };
};
