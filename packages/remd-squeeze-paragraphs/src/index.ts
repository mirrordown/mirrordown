import { visit } from "unist-util-visit";
import { whitespace } from "hast-util-whitespace";
import type { Element, Root } from "hast";
import type { Plugin } from "unified";

// A <p> is "empty" when it has no children, or every child is whitespace-only
// text. Mirrors upstream mdast-squeeze-paragraphs' `children.every(text && /^\s*$/)`.
const isEmpty = (node: Element): boolean =>
  node.children.every(
    (child) => child.type === "text" && whitespace(child.value)
  );

/** rehype plugin that removes empty (whitespace-only) paragraphs. */
export const rehypeSqueezeParagraphs: Plugin<[], Root> = () => (tree) => {
  visit(tree, "element", (node, index, parent) => {
    if (
      node.tagName === "p" &&
      parent &&
      typeof index === "number" &&
      isEmpty(node)
    ) {
      parent.children.splice(index, 1);
      return index;
    }
    return;
  });
};
