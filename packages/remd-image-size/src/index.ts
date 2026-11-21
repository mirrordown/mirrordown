import { visit } from "unist-util-visit";
import { parseImageSize } from "@mirrordown/core";
import type { Root } from "mdast";
import type { Plugin } from "unified";

// The attributes mdast-util-to-hast copies onto an image's `<img>`, after its `src`, `alt` and `title`.
interface ImageData {
  hProperties?: Record<string, unknown>;
}

/**
 * remark plugin that reads Obsidian's image size from an image's description: `![Engelbart|100x145](e.jpg)` renders `<img src="e.jpg" alt="Engelbart" width="100" height="145">`. The `alt` loses the size, so every plugin that reads the image afterwards sees it without. A `width` or `height` an attribute block wrote on the image (remark-attrs) wins over the description's. The rule is shared with the markdown-it and Sätteri plugins through `@mirrordown/core`.
 */
export const remarkImageSize: Plugin<[], Root> = () => (tree) => {
  visit(tree, (node) => {
    if (node.type !== `image` && node.type !== `imageReference`) return;
    const size = parseImageSize(node.alt ?? ``);
    if (!size) return;
    node.alt = size.description;
    const data: ImageData = (node.data ??= {});
    // The size goes before the attributes another plugin wrote (an attribute block's), whose values win: the order markdown-it and Sätteri write too, whichever plugin ran first.
    data.hProperties = {
      width: size.width,
      ...(size.height === undefined ? {} : { height: size.height }),
      ...data.hProperties
    };
  });
};
