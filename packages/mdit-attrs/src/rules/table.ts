import type { DelimiterConfig } from "../types.js";
import { addAttrs, getDelimiterChecker } from "../helper/index.js";
import type { AttrRule } from "./types.js";

export const createTableRules = (options: DelimiterConfig): AttrRule[] => {
  const check = getDelimiterChecker(options.left, options.right);

  // Rule 1: table-level attrs — standalone paragraph after the table  "\n{.class}"
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
        type: "table_close",
      },
    ],
    transform(tokens, index) {
      const inline = tokens[index]!;
      const content = inline.children![0]!.content.trim();
      const range = check(content, "only")!;

      // Find the matching table_open (start from table_close at index-2)
      let tableOpenIdx = -1;
      let depth = 1;
      for (let i = index - 3; i >= 0; i--) {
        const t = tokens[i]!;
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

      addAttrs(tokens[tableOpenIdx]!, content, range, options.allowed);

      // Remove paragraph_open + inline + paragraph_close
      tokens.splice(index - 1, 3);
    },
  };

  // Rule 2: table cell attrs — "cell content {.class}" inside td/th
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
            content: (content: string) => check(content.trim(), "end") !== null,
          },
        ],
      },
      {
        shift: -1,
        type: (t: string) => t === "td_open" || t === "th_open",
      },
    ],
    transform(tokens, index) {
      const inline = tokens[index]!;
      const children = inline.children!;
      const lastChild = children[children.length - 1]!;
      const content = lastChild.content.trimEnd();
      const range = check(content, "end")!;

      const cellOpen = tokens[index - 1]!;
      addAttrs(cellOpen, content, range, options.allowed);

      const attrStart = content.lastIndexOf(options.left, range[0] - 1);
      lastChild.content = content.slice(0, attrStart).trimEnd();
      if (lastChild.content === "" && children.length > 1) children.pop();
    },
  };

  // Rule 3: track column count in thead (stored as metadata for rowspan/colspan calc)
  interface TableMeta {
    cols: number;
    rowspan: number[];
  }

  const colTracker: AttrRule = {
    name: "table column tracker",
    tests: [{ shift: 0, type: "tr_open" }],
    transform(tokens, index) {
      // Count th tokens in this row to know column count; stored on thead_open meta
      let cols = 0;
      for (let i = index + 1; i < tokens.length; i++) {
        const t = tokens[i]!;
        if (t.type === "tr_close") break;
        if (t.type === "th_open") cols++;
      }
      if (cols === 0) return;

      // Find thead_open and store column count
      for (let i = index - 1; i >= 0; i--) {
        const t = tokens[i]!;
        if (t.type === "thead_open") {
          t.meta = t.meta ?? {};
          (t.meta as TableMeta).cols = cols;
          break;
        }
        if (t.type === "table_open") break;
      }
    },
  };

  // Rule 4: colspan/rowspan calculation — remove phantom cells, adjust span values
  const spanCalc: AttrRule = {
    name: "table span calculator",
    tests: [{ shift: 0, type: "tbody_open" }],
    transform(tokens, index) {
      // Find matching thead_open to get column count
      let cols = 0;
      for (let i = index - 1; i >= 0; i--) {
        const t = tokens[i]!;
        if (t.type === "thead_open") {
          cols = (t.meta as TableMeta | undefined)?.cols ?? 0;
          break;
        }
        if (t.type === "table_open") break;
      }
      if (cols === 0) return;

      // Find the tbody_close
      let tbodyClose = index + 1;
      let depth = 1;
      while (tbodyClose < tokens.length && depth > 0) {
        const t = tokens[tbodyClose]!;
        if (t.type === "tbody_open") depth++;
        else if (t.type === "tbody_close") depth--;
        tbodyClose++;
      }
      tbodyClose--;

      // Process each row within tbody
      const occupied: number[] = Array.from({ length: cols }, () => 0);

      let i = index + 1;
      while (i < tbodyClose) {
        const t = tokens[i]!;
        if (t.type === "tr_open") {
          // Decrement all occupied counts
          for (let c = 0; c < cols; c++) {
            if (occupied[c]! > 0) occupied[c]!--;
          }

          // Collect td tokens in this row
          const tdIndices: number[] = [];
          for (let j = i + 1; j < tbodyClose; j++) {
            if (tokens[j]!.type === "tr_close") break;
            if (tokens[j]!.type === "td_open") tdIndices.push(j);
          }

          // Assign cells to columns, skipping occupied ones
          let col = 0;
          let tdIdx = 0;

          while (col < cols && tdIdx < tdIndices.length) {
            // Skip occupied columns (from rowspan)
            while (col < cols && occupied[col]! > 0) col++;
            if (col >= cols) break;

            const tdOpen = tokens[tdIndices[tdIdx]!]!;
            const rowspanAttr = tdOpen.attrGet("rowspan");
            const colspanAttr = tdOpen.attrGet("colspan");
            const rowspan = rowspanAttr ? parseInt(rowspanAttr, 10) : 1;
            let colspan = colspanAttr ? parseInt(colspanAttr, 10) : 1;

            // Count how many consecutive free columns are available
            let freeCols = 0;
            for (let c = col; c < cols && occupied[c]! === 0; c++) freeCols++;

            // Clamp colspan to available free columns
            if (colspan > freeCols) {
              colspan = freeCols;
              if (colspan === 1) {
                // Remove colspan attr if it resolved to 1 (keep as-is if explicitly set)
                // We keep it to match reference behavior: colspan="1" is left on token
              }
              tdOpen.attrSet("colspan", String(colspan));
            }

            // Mark columns occupied by this cell's rowspan
            for (let c = col; c < col + colspan && c < cols; c++) {
              if (rowspan > 1) occupied[c] = rowspan - 1;
            }

            col += colspan;
            tdIdx++;
          }

          // Remove phantom cells beyond assigned ones
          // (cells that were merged away by rowspan from a previous row)
          while (tdIdx < tdIndices.length) {
            const phantomStart = tdIndices[tdIdx]!;
            // Find the matching td_close
            let phantomEnd = phantomStart + 1;
            while (phantomEnd < tokens.length && tokens[phantomEnd]!.type !== "td_close") {
              phantomEnd++;
            }
            tokens.splice(phantomStart, phantomEnd - phantomStart + 1);
            tbodyClose -= phantomEnd - phantomStart + 1;
            // Don't increment tdIdx since we just spliced
          }
        }
        i++;
      }
    },
  };

  return [tableAttrs, tableCellAttrs, colTracker, spanCalc];
};
