// Custom abbr node type isn't in the mdast union; cast bridges parent.type check.
/* oxlint-disable typescript/no-unsafe-type-assertion */
import { visit, CONTINUE } from "unist-util-visit";
import type { VisitorResult } from "unist-util-visit";
import type { Plugin, Transformer } from "unified";
import type { Data, Parent } from "unist";
import type { Root, Text, PhrasingContent } from "mdast";

interface AbbrData extends Data {
  hName: "abbr";
  hProperties: { title: string };
}

interface Abbr {
  type: "abbr";
  children: PhrasingContent[];
  data: AbbrData;
}

declare module "mdast" {
  interface PhrasingContentMap {
    abbr: Abbr;
  }

  interface RootContentMap {
    abbr: Abbr;
  }
}

const DEFINITION_RE = /^\*\[([^[\]]+)\]:\s*(.+)$/;

const ESCAPE_RE = /[.*+?^${}()|[\]\\]/g;

export const remarkAbbr: Plugin<[], Root> = () => {
  const transformer: Transformer<Root> = (tree) => {
    const abbreviations: Record<string, string> = {};
    const nodesToRemove: Array<{ parent: Parent; index: number }> = [];

    visit(tree, "paragraph", (node, index, parent) => {
      /* v8 ignore next */
      if (!parent || typeof index === "undefined") return;
      if (node.children.length !== 1 || node.children[0].type !== "text")
        return;

      const text = node.children[0].value;
      const lines = text.split("\n");
      const defLines: Array<[string, string]> = [];

      for (const line of lines) {
        const match = DEFINITION_RE.exec(line);
        if (!match) return;
        defLines.push([match[1], match[2].trim()]);
      }

      for (const [abbr, title] of defLines) {
        if (!(abbr in abbreviations)) abbreviations[abbr] = title;
      }

      nodesToRemove.push({ parent, index });
    });

    for (const { parent, index } of [...nodesToRemove].reverse()) {
      parent.children.splice(index, 1);
    }

    if (Object.keys(abbreviations).length === 0) return;

    const keys = Object.keys(abbreviations).sort((a, b) => b.length - a.length);
    const escaped = keys.map((k) => k.replace(ESCAPE_RE, "\\$&"));
    const regex = new RegExp(`\\b(${escaped.join("|")})\\b`, "g");

    visit(tree, "text", (node: Text, index, parent): VisitorResult => {
      /* v8 ignore next */
      if (!parent || typeof index === "undefined") return;
      if ((parent as unknown as { type: string }).type === "abbr") return;
      if (!regex.test(node.value)) return;

      regex.lastIndex = 0;
      const children: PhrasingContent[] = [];
      let lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = regex.exec(node.value)) !== null) {
        const word = match[1];
        if (match.index > lastIndex) {
          children.push({
            type: "text",
            value: node.value.slice(lastIndex, match.index)
          });
        }
        children.push({
          type: "abbr",
          children: [{ type: "text", value: word }],
          data: { hName: "abbr", hProperties: { title: abbreviations[word] } }
        });
        lastIndex = match.index + word.length;
      }

      if (lastIndex < node.value.length) {
        children.push({ type: "text", value: node.value.slice(lastIndex) });
      }

      (parent as Parent).children.splice(index, 1, ...children);
      return [CONTINUE, index + children.length];
    });
  };

  return transformer;
};
