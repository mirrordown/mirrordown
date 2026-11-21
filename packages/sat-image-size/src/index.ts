import { parseImageSize } from "@mirrordown/core";
import {
  defineMdastPlugin,
  type MdastPluginInstance,
  type MdastVisitorContext,
  type PluginFactoryContext
} from "satteri";

type ImageVisitor = NonNullable<MdastPluginInstance["image"]>;
type ImageReferenceVisitor = NonNullable<MdastPluginInstance["imageReference"]>;
type Image = Parameters<ImageVisitor>[0] | Parameters<ImageReferenceVisitor>[0];

/**
 * The plugin's definition: only the keys it defines, with synchronous visitors, so `markdownToHtml` returns its result directly.
 */
export interface ImageSizePlugin {
  name: string;
  image: (...args: Parameters<ImageVisitor>) => void;
  imageReference: (...args: Parameters<ImageReferenceVisitor>) => void;
}

const size = (node: Image, ctx: MdastVisitorContext): void => {
  const found = parseImageSize(node.alt ?? ``);
  if (!found) return;
  ctx.setField(node, `alt`, found.description);
  const data: Record<string, unknown> = { ...node.data };
  // The size goes before the attributes Sätteri's `attributes` feature read from a block, whose values win: the order markdown-it and remark write too.
  const authored =
    typeof data[`hProperties`] === `object` ? data[`hProperties`] : undefined;
  ctx.setProperty(node, `data`, {
    ...data,
    hProperties: {
      width: found.width,
      ...(found.height === undefined ? {} : { height: found.height }),
      ...authored
    }
  });
};

/**
 * Sätteri plugin that reads Obsidian's image size from an image's description: `![Engelbart|100x145](e.jpg)` renders `<img src="e.jpg" alt="Engelbart" width="100" height="145">`. The `alt` loses the size, so every plugin that reads the image afterwards sees it without. A `width` or `height` written in an attribute block (the `attributes` feature) wins over the description's. The rule is shared with the markdown-it and remark plugins through `@mirrordown/core`.
 */
export const satteriImageSize =
  (): ((ctx: PluginFactoryContext) => ImageSizePlugin) => () =>
    defineMdastPlugin({
      name: `image-size`,
      image: size,
      imageReference: size
    });
