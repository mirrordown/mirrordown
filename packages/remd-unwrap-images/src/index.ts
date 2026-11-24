import { SKIP, visit } from "unist-util-visit";
import { unwrapImageParagraph } from "@mirrordown/core";
import type { Root } from "hast";
import type { Plugin } from "unified";

/** rehype plugin that unwraps block-level images out of their paragraph, giving the paragraph's attributes to its one image. The rule is shared with the Sätteri plugin through `@mirrordown/core`. */
export const rehypeUnwrapImages: Plugin<[], Root> = () => (tree) => {
  visit(tree, "element", (node, index, parent) => {
    if (!parent || typeof index !== "number") return;
    const content = unwrapImageParagraph(node);
    if (!content) return;
    parent.children.splice(index, 1, ...content);
    return [SKIP, index];
  });
};
