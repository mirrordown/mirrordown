import { isEmptyParagraph } from "@mirrordown/core";
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
export interface SqueezeParagraphsPlugin {
  name: string;
  element: {
    filter: string[];
    visit: (...args: Parameters<ElementVisitor["visit"]>) => void;
  };
}

/**
 * Sätteri plugin that removes empty (whitespace-only) paragraphs, such as the residue other plugins leave. The rule is shared with the markdown-it and rehype plugins through `@mirrordown/core`. List it last among your hast plugins so it sees that residue.
 */
export const satteriSqueezeParagraphs =
  (): ((ctx: PluginFactoryContext) => SqueezeParagraphsPlugin) => () =>
    defineHastPlugin({
      name: `squeeze-paragraphs`,
      element: {
        filter: [`p`],
        visit(node, ctx) {
          if (isEmptyParagraph(node)) ctx.removeNode(node);
        }
      }
    });
