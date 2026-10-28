import { visit } from "unist-util-visit";
import { isEmptyParagraph } from "@mirrordown/core";
import type { Root } from "hast";
import type { Plugin } from "unified";

/** rehype plugin that removes empty (whitespace-only) paragraphs. The rule is shared with the Sätteri plugin through `@mirrordown/core`. */
export const rehypeSqueezeParagraphs: Plugin<[], Root> = () => (tree) => {
  visit(tree, "element", (node, index, parent) => {
    if (parent && typeof index === "number" && isEmptyParagraph(node)) {
      parent.children.splice(index, 1);
      return index;
    }
    return;
  });
};
