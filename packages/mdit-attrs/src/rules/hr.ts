import type { DelimiterConfig } from "../types.js";
import { addAttrs, getDelimiterChecker } from "../helper/index.js";
import type { AttrRule } from "./types.js";

export const createHrRule = (options: DelimiterConfig): AttrRule => {
  const check = getDelimiterChecker(options.left, options.right);

  return {
    name: "hr attributes",
    tests: [
      {
        shift: 0,
        type: "inline",
        children: [
          {
            index: 0,
            type: "text",
            content: (content: string) => check(content.trim(), "only") !== null,
          },
        ],
      },
      {
        shift: -2,
        type: "hr",
      },
    ],
    transform(tokens, index) {
      const inline = tokens[index]!;
      const textChild = inline.children![0]!;
      const content = textChild.content.trim();
      const range = check(content, "only")!;

      const hr = tokens[index - 2]!;
      addAttrs(hr, content, range, options.allowed);

      // Remove paragraph_open + inline + paragraph_close
      tokens.splice(index - 1, 3);
    },
  };
};
