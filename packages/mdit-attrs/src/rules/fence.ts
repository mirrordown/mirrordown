import type { DelimiterConfig } from "../types.js";
import { addAttrs, getDelimiterChecker } from "../helper/index.js";
import type { AttrRule } from "./types.js";

export const createFenceRule = (options: DelimiterConfig): AttrRule => {
  const check = getDelimiterChecker(options.left, options.right);

  return {
    name: "fence attributes",
    tests: [
      {
        shift: 0,
        type: "fence",
      },
    ],
    transform(tokens, index) {
      const token = tokens[index]!;
      const info = token.info.trim();
      const range = check(info, "end") ?? check(info, "only");
      if (!range) return;
      addAttrs(token, info, range, options.allowed);
      // Strip the attr block from the info string, preserving the language tag
      token.info = info.slice(0, info.lastIndexOf(options.left, range[0] - 1)).trimEnd();
    },
  };
};
