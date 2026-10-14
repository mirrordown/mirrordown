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
        type: "fence"
      }
    ],
    transform(tokens, index) {
      const token = tokens[index];
      const info = token.info.trim();
      const range = check(info, "end") ?? check(info, "only");
      if (!range) return;
      addAttrs(token, info, range, options.allowed);
      // Strip the attr block from the info string, preserving the language tag
      token.info = info
        .slice(0, info.lastIndexOf(options.left, range[0] - 1))
        .trimEnd();
      // markdown-it's fence renderer appends the language class to an existing
      // `class` attribute but otherwise adds `class` last. Reserve the slot
      // first, so `class` leads as it does in remd (mdast-util-to-hast creates
      // the language class before applying attributes, and a remark plugin
      // cannot reorder it). The renderer wrapper trims the leading space.
      if (token.info && token.attrIndex("class") < 0) {
        token.attrs = [["class", ""], ...(token.attrs ?? [])];
        token.meta = { ...token.meta, attrsReservedClass: true };
      }
    }
  };
};
