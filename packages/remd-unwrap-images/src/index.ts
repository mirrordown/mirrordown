import { SKIP, visit } from "unist-util-visit";
import { isImageParagraph } from "@mirrordown/core";
import type { Root } from "hast";
import type { Plugin } from "unified";

/** rehype plugin that unwraps block-level images out of their paragraph. The rule is shared with the Sätteri plugin through `@mirrordown/core`. */
export const rehypeUnwrapImages: Plugin<[], Root> = () => (tree) => {
  visit(tree, "element", (node, index, parent) => {
    if (parent && typeof index === "number" && isImageParagraph(node)) {
      parent.children.splice(index, 1, ...node.children);
      return [SKIP, index];
    }
    return;
  });
};
