import type Token from "markdown-it/lib/token.mjs";
import type { DelimiterConfig } from "../types.js";
import { addAttrs, getDelimiterChecker } from "../helper/index.js";
import type { AttrRule } from "./types.js";

export const createInlineRules = (options: DelimiterConfig): AttrRule[] => {
  const check = getDelimiterChecker(options.left, options.right);

  // Blocks that open the text right after an element go on it, and the text
  // after them stays, as in markdown-it-attrs.
  const takeLeadingAttrs = (
    target: Token,
    children: Token[],
    i: number
  ): void => {
    const child = children[i];
    let content = child.content;
    let range = check(content, "start");
    while (range) {
      addAttrs(target, content, range, options.allowed);
      content = content.slice(range[1] + options.right.length);
      range = check(content, "start");
    }
    if (content) child.content = content;
    else children.splice(i, 1);
  };

  // Handles self-closing inline elements that render attributes: `code` and
  // images. Other nesting-0 tokens (hard breaks, raw HTML) drop attributes when
  // rendered, so they are left for the end-of-block rule, as in markdown-it-attrs.
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

        if (!check(child.content, "start")) continue;

        const prev = children[i - 1];
        // oxlint-disable-next-line typescript/no-unnecessary-condition
        if (prev?.type !== "image" && prev?.type !== "code_inline") continue;

        takeLeadingAttrs(prev, children, i);
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

        if (!check(child.content, "start")) continue;

        // The preceding sibling must be a closing tag (nesting === -1)
        const prev = children[i - 1];
        // oxlint-disable-next-line typescript/no-unnecessary-condition
        if (!prev || prev.nesting !== -1) continue;

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

        takeLeadingAttrs(children[openIdx], children, i);
        modified = true;
      }

      return modified;
    }
  };

  return [selfClose, closing];
};
