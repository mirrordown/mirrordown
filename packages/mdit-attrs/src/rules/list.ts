import type { DelimiterConfig } from "../types.js";
import { addAttrs, getDelimiterChecker } from "../helper/index.js";
import type { AttrRule } from "./types.js";

export const createListRules = (options: DelimiterConfig): AttrRule[] => {
  const check = getDelimiterChecker(options.left, options.right);

  // Rule 1: attrs at end of a list item inline  "- item{.red}"
  const listItemEnd: AttrRule = {
    name: "list item end",
    tests: [
      {
        shift: 0,
        type: "inline",
        children: [
          {
            index: -1,
            type: (t: string) => t !== "code_inline",
            content: (content: string) => check(content.trim(), "end") !== null,
          },
        ],
      },
      {
        shift: -1,
        type: "paragraph_open",
      },
      {
        shift: -2,
        type: "list_item_open",
      },
    ],
    transform(tokens, index) {
      const inline = tokens[index]!;
      const children = inline.children!;
      const lastChild = children[children.length - 1]!;
      const content = lastChild.content.trimEnd();
      const range = check(content, "end")!;

      // Apply to the list_item_open (paragraph_open is at index-1, list_item_open at index-2)
      const listItemOpen = tokens[index - 2]!;
      addAttrs(listItemOpen, content, range, options.allowed);

      const attrStart = content.lastIndexOf(options.left, range[0] - 1);
      lastChild.content = content.slice(0, attrStart).trimEnd();
      if (lastChild.content === "" && children.length > 1) children.pop();
    },
  };

  // Rule 2: attrs on own paragraph after bullet/ordered list close → apply to list
  // Structure: bullet_list_close(-2) paragraph_open(-1) inline(0) paragraph_close(+1)
  const listAttr: AttrRule = {
    name: "list attributes",
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
        shift: -1,
        type: "paragraph_open",
      },
      {
        shift: -2,
        type: (t: string) => t === "bullet_list_close" || t === "ordered_list_close",
      },
    ],
    transform(tokens, index) {
      const inline = tokens[index]!;
      const children = inline.children!;
      const textChild = children[0]!;
      const content = textChild.content.trim();
      const range = check(content, "only")!;

      // Find the matching list_open for the close token at index-2
      const closeToken = tokens[index - 2]!;
      const openType = closeToken.type.replace("_close", "_open");

      let depth = 1;
      let listOpenIdx = -1;
      for (let i = index - 3; i >= 0; i--) {
        const t = tokens[i]!;
        if (t.type === closeToken.type) depth++;
        else if (t.type === openType) {
          depth--;
          if (depth === 0) {
            listOpenIdx = i;
            break;
          }
        }
      }

      if (listOpenIdx === -1) return;
      addAttrs(tokens[listOpenIdx]!, content, range, options.allowed);

      // Remove paragraph_open + inline + paragraph_close
      tokens.splice(index - 1, 3);
    },
  };

  return [listItemEnd, listAttr];
};
