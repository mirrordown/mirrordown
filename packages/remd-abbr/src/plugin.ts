// Custom abbr node type isn't in the mdast union; cast bridges parent.type check.
/* oxlint-disable typescript/no-unsafe-type-assertion */
import { visit, CONTINUE } from "unist-util-visit";
import type { VisitorResult } from "unist-util-visit";
import type { Plugin, Transformer } from "unified";
import type { Parent } from "unist";
import type { Root, Text, PhrasingContent } from "mdast";
import {
  carryEscapes,
  createAbbreviationScan,
  parseAbbreviations,
  textEscapes
} from "@mirrordown/core";

/** remark plugin for abbreviations (`*[term]: definition`), rendering `<abbr>` elements. The definition and term rules are shared with the Sätteri plugin through `@mirrordown/core`. */
export const remarkAbbr: Plugin<[], Root> = () => {
  const transformer: Transformer<Root> = (tree, file) => {
    const abbreviations = new Map<string, string>();
    const nodesToRemove: Array<{ parent: Parent; index: number }> = [];
    const source = String(file);

    visit(tree, "paragraph", (node, index, parent) => {
      /* v8 ignore next */
      if (!parent || typeof index === "undefined") return;
      const [only] = node.children;
      const start = node.position?.start.offset;
      const end = node.position?.end.offset;
      // A definition is read from its source line, as markdown-it reads it, so inline syntax in a title does not make the line text. A tree transformed without its file has no source, and neither has a paragraph another plugin built: there the paragraph's text is read.
      const definitions = parseAbbreviations(
        node.children.length === 1 && only.type === "text"
          ? only.value
          : undefined,
        start !== undefined && end !== undefined && end <= source.length
          ? source.slice(start, end)
          : undefined
      );
      if (!definitions) return;
      // The first definition of a term wins.
      for (const [term, title] of definitions) {
        if (!abbreviations.has(term)) abbreviations.set(term, title);
      }
      nodesToRemove.push({ parent, index });
    });

    for (const { parent, index } of [...nodesToRemove].reverse()) {
      parent.children.splice(index, 1);
    }

    if (abbreviations.size === 0) return;
    const scan = createAbbreviationScan(abbreviations);

    visit(tree, "text", (node: Text, index, parent): VisitorResult => {
      /* v8 ignore next */
      if (!parent || typeof index === "undefined") return;
      if ((parent as unknown as { type: string }).type === "abbr") return;
      const parts = scan(node.value);
      if (!parts) return;
      // The pieces have no source position, so each keeps a record of which of its characters were escaped: a span plugin that runs later still tells `\==` from `==`.
      const escaped = textEscapes(node, source);
      let offset = 0;
      const children = parts.map((part): PhrasingContent => {
        const text: Text = {
          type: "text",
          value: "text" in part ? part.text : part.term
        };
        carryEscapes(text, escaped, offset);
        offset += text.value.length;
        return "text" in part
          ? text
          : ({
              type: "abbr",
              children: [text],
              data: { hName: "abbr", hProperties: { title: part.title } }
            } as unknown as PhrasingContent);
      });
      (parent as Parent).children.splice(index, 1, ...children);
      return [CONTINUE, index + children.length];
    });
  };

  return transformer;
};
