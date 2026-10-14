import { sectionize } from "@mirrordown/core";
import type { ElementContent, Root, RootContent } from "hast";
import type { Plugin } from "unified";

// A Root child is either ElementContent (comment | element | text) or a Doctype. A Doctype is never a heading and, in practice, only appears at the very top of a document, so it is kept as leading preamble ahead of the sections.
const isElementContent = (node: RootContent): node is ElementContent =>
  node.type !== "doctype";

/** rehype plugin that wraps headings and their content in <section> elements. The algorithm is shared with the Sätteri plugin through `@mirrordown/core`. */
export const rehypeSectionize: Plugin<[], Root> = () => (tree) => {
  const preamble = tree.children.filter((node) => !isElementContent(node));
  const content = tree.children.filter(isElementContent);
  tree.children = [
    ...preamble,
    ...sectionize<ElementContent>(content, (depth, children) => ({
      type: "element",
      tagName: "section",
      properties: { dataDepth: depth },
      children
    }))
  ];
};
