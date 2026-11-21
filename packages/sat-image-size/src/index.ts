import { parseImageSize, type ImageSize } from "@mirrordown/core";
import {
  defineMdastPlugin,
  type MdastPluginInstance,
  type PluginFactoryContext
} from "satteri";

type ImageVisitor = NonNullable<MdastPluginInstance["image"]>;
type ImageReferenceVisitor = NonNullable<MdastPluginInstance["imageReference"]>;

/**
 * The plugin's definition: only the keys it defines, with synchronous visitors, so `markdownToHtml` returns its result directly.
 */
export interface ImageSizePlugin {
  name: string;
  image: (...args: Parameters<ImageVisitor>) => void;
  imageReference: (...args: Parameters<ImageReferenceVisitor>) => void;
}

// An image's data with the size in its `hProperties`, before the attributes Sätteri's `attributes` feature read from a block, whose values win: the order markdown-it and remark write too.
const sizedData = (
  data: object | undefined,
  size: ImageSize
): Record<string, unknown> => {
  const current: Record<string, unknown> = { ...data };
  const authored =
    typeof current.hProperties === `object` ? current.hProperties : undefined;
  return {
    ...current,
    hProperties: {
      width: size.width,
      ...(size.height === undefined ? {} : { height: size.height }),
      ...authored
    }
  };
};

/**
 * Sätteri plugin that reads Obsidian's image size from an image's description: `![Engelbart|100x145](e.jpg)` renders `<img src="e.jpg" alt="Engelbart" width="100" height="145">`. The `alt` loses the size, so every plugin that reads the image afterwards sees it without. A `width` or `height` written in an attribute block (the `attributes` feature) wins over the description's. The rule is shared with the markdown-it and remark plugins through `@mirrordown/core`.
 */
export const satteriImageSize =
  (): ((ctx: PluginFactoryContext) => ImageSizePlugin) => () =>
    defineMdastPlugin({
      name: `image-size`,
      image(node, ctx) {
        const size = parseImageSize(node.alt ?? ``);
        if (!size) return;
        ctx.setField(node, `alt`, size.description);
        ctx.setField(node, `data`, sizedData(node.data, size));
      },
      // A reference keeps its own label and identifier, which find its definition.
      imageReference(node, ctx) {
        const size = parseImageSize(node.alt ?? ``);
        if (!size) return;
        ctx.setField(node, `alt`, size.description);
        ctx.setField(node, `data`, sizedData(node.data, size));
      }
    });
