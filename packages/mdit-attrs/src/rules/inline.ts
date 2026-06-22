import type { DelimiterConfig } from "../types.js";
import { addAttrs, getDelimiterChecker } from "../helper/index.js";
import type { AttrRule } from "./types.js";

export const createInlineRules = (options: DelimiterConfig): AttrRule[] => {
  const check = getDelimiterChecker(options.left, options.right);

  // Handles self-closing inline elements: `code`, images (nesting === 0)
  const selfClose: AttrRule = {
    name: "inline nesting self-close",
    tests: [{ shift: 0, type: "inline" }],
    transform(tokens, index) {
      const token = tokens[index];
      const children = token.children!;
      let modified = false;

      for (let i = children.length - 1; i >= 0; i--) {
        const child = children[i];
        if (child.type !== "text") continue;

        const range = check(child.content, "only");
        if (!range) continue;

        // The preceding sibling must be nesting === 0 but not a softbreak
        const prev = children[i - 1];
        if (prev.nesting !== 0 || prev.type === "softbreak") continue;

        addAttrs(prev, child.content, range, options.allowed);
        children.splice(i, 1);
        modified = true;
      }

      return modified;
    }
  };

  // Handles closing inline elements: em, strong, s, etc. (nesting === -1)
  const closing: AttrRule = {
    name: "inline attributes",
    tests: [
      {
        shift: 0,
        type: "inline"
      }
    ],
    transform(tokens, index) {
      const token = tokens[index];
      const children = token.children!;
      let modified = false;

      for (let i = children.length - 1; i >= 0; i--) {
        const child = children[i];
        if (child.type !== "text") continue;

        const range = check(child.content, "only");
        if (!range) continue;

        // The preceding sibling must be a closing tag (nesting === -1)
        const prev = children[i - 1];
        if (prev.nesting !== -1) continue;

        // Find the matching opening token among children
        const openType = prev.type.replace(/_close$/, "_open");
        let openIdx = -1;
        for (let j = i - 2; j >= 0; j--) {
          if (
            children[j].type === openType &&
            children[j].level === prev.level
          ) {
            openIdx = j;
            break;
          }
        }
        if (openIdx === -1) continue;

        addAttrs(children[openIdx], child.content, range, options.allowed);
        children.splice(i, 1);
        modified = true;
      }

      return modified;
    }
  };

  return [selfClose, closing];
};
