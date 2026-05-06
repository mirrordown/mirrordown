import type { DelimiterConfig } from "../types.js";
import { addAttrs, getDelimiterChecker } from "../helper/index.js";
import type { AttrRule } from "./types.js";

export const createSoftbreakRule = (options: DelimiterConfig): AttrRule => {
  const check = getDelimiterChecker(options.left, options.right);

  return {
    name: "softbreak attributes",
    tests: [
      {
        shift: 0,
        type: "inline",
        children: [
          {
            // second-to-last child must be a softbreak
            index: -2,
            type: "softbreak",
          },
          {
            // last child must be a text node containing only an attr block
            index: -1,
            type: "text",
            content: (content: string) => check(content.trim(), "only") !== null,
          },
        ],
      },
    ],
    transform(tokens, index) {
      const inline = tokens[index]!;
      const children = inline.children!;
      const attrChild = children[children.length - 1]!;

      const content = attrChild.content.trim();
      const range = check(content, "only")!;

      // Walk backward to find the nearest nesting===1 opener that contains this inline
      let target = tokens[index]!;
      for (let i = index - 1; i >= 0; i--) {
        const t = tokens[i]!;
        if (t.nesting === 1) {
          target = t;
          break;
        }
      }

      addAttrs(target, content, range, options.allowed);

      // Remove the attr text child and the preceding softbreak
      children.splice(children.length - 2, 2);
    },
  };
};
