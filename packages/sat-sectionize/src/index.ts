import { sectionize, type HastLike } from "@mirrordown/core";
import {
  defineHastPlugin,
  type HastVisitorInstance,
  type PluginFactoryContext
} from "satteri";

type AfterHook = NonNullable<HastVisitorInstance["after"]>;

/**
 * The plugin's definition: only the keys it defines, with synchronous visitors, so `markdownToHtml` returns its result directly.
 */
export interface SectionizePlugin {
  name: string;
  after: (...args: Parameters<AfterHook>) => void;
}

/**
 * Sätteri plugin that wraps each heading and the content up to the next heading of the same or a shallower rank in a `<section data-depth>`, nesting deeper sections inside. The algorithm is shared with the markdown-it and rehype plugins through `@mirrordown/core`. List it before slug and autolink-headings, which still find the nested headings.
 */
export const satteriSectionize =
  (): ((ctx: PluginFactoryContext) => SectionizePlugin) => () =>
    defineHastPlugin({
      name: `sectionize`,
      // Sectioning regroups the whole document, so it runs once on the root.
      after(root, ctx) {
        // A doctype is never a heading; it stays ahead of the sections.
        const preamble = root.children.filter(
          (node) => node.type === `doctype`
        );
        const content = root.children.filter((node) => node.type !== `doctype`);
        // Sätteri's root may hold raw HTML and MDX nodes, which its `Element` type doesn't list as children; sectioning only reads tag names, so it runs on the structural shape.
        const sections = sectionize<HastLike>(content, (depth, children) => ({
          type: `element`,
          tagName: `section`,
          properties: { dataDepth: depth },
          children
        }));
        ctx.setProperty(root, `children`, [...preamble, ...sections]);
      }
    });
