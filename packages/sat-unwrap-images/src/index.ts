import { isImageParagraph } from "@mirrordown/core";
import {
  defineHastPlugin,
  type HastVisitorInstance,
  type PluginFactoryContext
} from "satteri";

type ElementVisitor = Extract<
  NonNullable<HastVisitorInstance["element"]>,
  { filter: string[] }
>;

/**
 * The plugin's definition: only the keys it defines, with synchronous visitors, so `markdownToHtml` returns its result directly.
 */
export interface UnwrapImagesPlugin {
  name: string;
  element: {
    filter: string[];
    visit: (...args: Parameters<ElementVisitor["visit"]>) => void;
  };
}

/**
 * Sätteri plugin that unwraps block-level images: a paragraph holding only images (each possibly inside a link or a lightbox button) is replaced by its children. The rule is shared with the markdown-it and rehype plugins through `@mirrordown/core`.
 */
export const satteriUnwrapImages =
  (): ((ctx: PluginFactoryContext) => UnwrapImagesPlugin) => () =>
    defineHastPlugin({
      name: `unwrap-images`,
      element: {
        filter: [`p`],
        visit(node, ctx) {
          if (isImageParagraph(node)) ctx.replaceNode(node, [...node.children]);
        }
      }
    });
