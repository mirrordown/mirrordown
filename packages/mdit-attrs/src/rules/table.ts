import type { DelimiterConfig } from "../types.js";
import { addAttrs, getDelimiterChecker } from "../helper/index.js";
import type { AttrRule } from "./types.js";

export const createTableRules = (options: DelimiterConfig): AttrRule[] => {
  const check = getDelimiterChecker(options.left, options.right);

  // Rule 1: table-level attrs â€” standalone paragraph after the table  "\n{.class}"
  const tableAttrs: AttrRule = {
    name: "table attributes",
    tests: [
      {
        shift: 0,
        type: "inline",
        children: [
          {
            index: 0,
            type: "text",
            content: (content: string) => check(content.trim(), "only") !== null
          }
        ]
      },
      {
        shift: -1,
        type: "paragraph_open"
      },
      {
        shift: -2,
        type: "table_close"
      }
    ],
    transform(tokens, index) {
      const inline = tokens[index];
      const content = inline.children![0].content.trim();
      const range = check(content, "only")!;

      // Find the matching table_open (start from table_close at index-2)
      let tableOpenIdx = -1;
      let depth = 1;
      for (let i = index - 3; i >= 0; i--) {
        const t = tokens[i];
        if (t.type === "table_close") depth++;
        else if (t.type === "table_open") {
          depth--;
          if (depth === 0) {
            tableOpenIdx = i;
            break;
          }
        }
      }
      if (tableOpenIdx === -1) return;

      addAttrs(tokens[tableOpenIdx], content, range, options.allowed);

      // Remove paragraph_open + inline + paragraph_close
      tokens.splice(index - 1, 3);
    }
  };

  // Rule 2: table cell attrs â€” "cell content {.class}" inside td/th
  const tableCellAttrs: AttrRule = {
    name: "table cell attributes",
    tests: [
      {
        shift: 0,
        type: "inline",
        children: [
          {
            index: -1,
            type: "text",
            content: (content: string) => check(content.trim(), "end") !== null
          }
        ]
      },
      {
        shift: -1,
        type: (t: string) => t === "td_open" || t === "th_open"
      }
    ],
    transform(tokens, index) {
      const inline = tokens[index];
      const children = inline.children!;
      const lastChild = children[children.length - 1];
      const content = lastChild.content.trimEnd();
      const range = check(content, "end")!;

      const cellOpen = tokens[index - 1];
      addAttrs(cellOpen, content, range, options.allowed);

      const attrStart = content.lastIndexOf(options.left, range[0] - 1);
      lastChild.content = content.slice(0, attrStart).trimEnd();
      if (lastChild.content === "" && children.length > 1) children.pop();
    }
  };

  return [tableAttrs, tableCellAttrs];
};
