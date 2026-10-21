import type Token from "markdown-it/lib/token.mjs";
import type { DelimiterConfig } from "../types.js";
import {
  addAttrs,
  containersKept,
  getDelimiterChecker,
  itemColumns
} from "../helper/index.js";
import type { LineContainer } from "../helper/index.js";
import type { AttrRule } from "./types.js";

/** A container the line holding an attribute block can be written in. */
interface Container {
  open: Token;
  /** The token the block goes on when the line is written outside the container. */
  target: Token;
  line: LineContainer;
}

export const createSoftbreakRule = (options: DelimiterConfig): AttrRule => {
  const check = getDelimiterChecker(options.left, options.right);

  // A block on a line of its own, ending a paragraph or setext heading after a
  // soft or hard break, goes on the block that ends right before it at the
  // level the line is written, as kramdown places a block IAL: the paragraph
  // (its list item, in a tight list), or, for a line lazily written outside
  // some of the blockquotes and list items around it, the outermost of those it
  // leaves (a list item's list). markdown-it-attrs can't tell those levels
  // apart, as the token stream drops the line's indentation; the source keeps it.
  return {
    name: "softbreak attributes",
    tests: [
      {
        shift: 0,
        type: "inline",
        children: [
          {
            index: -2,
            type: (type: string) => type === "softbreak" || type === "hardbreak"
          },
          {
            index: -1,
            type: "text",
            content: (content: string) => check(content.trim(), "only") !== null
          }
        ]
      }
    ],
    transform(tokens, index, _position, _range, src) {
      const inline = tokens[index];
      const children = inline.children!;
      const content = children[children.length - 1].content.trim();
      const range = check(content, "only")!;

      // The blocks around the inline, innermost first, up to the first that
      // holds its own source (a panel tokenized from its body), which token
      // maps inside it index instead.
      const ancestors: Token[] = [];
      let source = src;
      let level = inline.level;
      for (let i = index - 1; i >= 0 && level > 0; i--) {
        const token = tokens[i];
        if (token.nesting !== 1 || token.level >= level) continue;
        level = token.level;
        const meta: unknown = token.meta;
        const own =
          typeof meta === "object" && meta !== null && "attrsSource" in meta
            ? meta.attrsSource
            : undefined;
        if (typeof own === "string") {
          source = own;
          break;
        }
        ancestors.push(token);
      }
      const block = ancestors.at(0);
      if (!block) return;

      const lines = source.split("\n");
      const containers: Container[] = [];
      let quotes = 0;
      for (let i = ancestors.length - 1; i >= 1; i--) {
        const open = ancestors[i];
        if (open.type === "blockquote_open") {
          containers.push({
            open,
            target: open,
            line: { kind: "quote", markers: ++quotes }
          });
        } else if (open.type === "list_item_open" && open.map) {
          // Items opened on the same line as this one, outside it, come first there.
          const before = containers.filter(
            (c) =>
              c.open.type === "list_item_open" &&
              c.open.map?.[0] === open.map![0]
          ).length;
          const column = itemColumns(lines[open.map[0]] ?? "").at(before);
          if (column === undefined) return;
          containers.push({
            open,
            target: ancestors.at(i + 1) ?? open,
            line: { kind: "item", column }
          });
        }
      }

      const line = inline.map ? (lines[inline.map[1] - 1] ?? "") : "";
      const kept = inline.map
        ? containersKept(
            line,
            containers.map((c) => c.line)
          )
        : containers.length;

      let target = block;
      if (kept < containers.length) target = containers[kept].target;
      // A tight list hides its paragraphs, so the item shows the attributes.
      else if (block.hidden && ancestors[1]?.type === "list_item_open")
        target = ancestors[1];
      addAttrs(target, content, range, options.allowed);

      // Remove the attr text, and a soft break before it; keep a hard break,
      // as markdown-it-attrs does.
      const isSoft = children[children.length - 2].type === "softbreak";
      children.splice(children.length - (isSoft ? 2 : 1), isSoft ? 2 : 1);
    }
  };
};
