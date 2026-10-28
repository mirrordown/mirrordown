// Custom abbr node type isn't in the mdast union; cast bridges parent.type check.
/* oxlint-disable typescript/no-unsafe-type-assertion */
import { visit, CONTINUE } from "unist-util-visit";
import type { VisitorResult } from "unist-util-visit";
import type { Plugin, Transformer } from "unified";
import type { Parent } from "unist";
import type { Root, Text, PhrasingContent } from "mdast";
import { createAbbreviationScan, parseAbbreviations } from "@mirrordown/core";

/** remark plugin for abbreviations (`*[term]: definition`), rendering `<abbr>` elements. The definition and term rules are shared with the Sätteri plugin through `@mirrordown/core`. */
export const remarkAbbr: Plugin<[], Root> = () => {
  const transformer: Transformer<Root> = (tree) => {
    const abbreviations = new Map<string, string>();
    const nodesToRemove: Array<{ parent: Parent; index: number }> = [];

    visit(tree, "paragraph", (node, index, parent) => {
      /* v8 ignore next */
      if (!parent || typeof index === "undefined") return;
      const [only] = node.children;
      if (node.children.length !== 1 || only.type !== "text") return;
      const definitions = parseAbbreviations(only.value);
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
      const children: PhrasingContent[] = parts.map((part) =>
        "text" in part
          ? { type: "text", value: part.text }
          : {
              type: "abbr",
              children: [{ type: "text", value: part.term }],
              data: { hName: "abbr", hProperties: { title: part.title } }
            }
      );
      (parent as Parent).children.splice(index, 1, ...children);
      return [CONTINUE, index + children.length];
    });
  };

  return transformer;
};
