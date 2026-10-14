import GithubSlugger from "github-slugger";
import {
  defineHastPlugin,
  type HastVisitorInstance,
  type PluginFactoryContext
} from "satteri";

/** Options for the {@link satteriSlug} plugin. */
export interface SlugOptions {
  /** Prefix to add in front of every generated `id` (default: `""`). */
  prefix?: string;
}

const HEADINGS = ["h1", "h2", "h3", "h4", "h5", "h6"];

type ElementVisitor = Extract<
  NonNullable<HastVisitorInstance["element"]>,
  { filter: string[] }
>;

/**
 * The plugin's definition. It lists only the keys the plugin defines, with a synchronous visitor: Sätteri infers whether `markdownToHtml` returns a Promise from every key of a plugin's type, so `HastPluginDefinition`'s optional, possibly-async visitor keys would make the result a union.
 */
export interface SlugPlugin {
  name: string;
  element: {
    filter: string[];
    visit: (...args: Parameters<ElementVisitor["visit"]>) => void;
  };
}

/**
 * Sätteri hast plugin that adds GitHub-style `id` slugs to headings (`h1`–`h6`), derived from their text content via {@link https://github.com/Flet/github-slugger | github-slugger}.
 *
 * Headings that already carry an `id` are left untouched, so an explicit id always wins. Repeated heading text dedupes with a numeric suffix (`heading`, `heading-1`, …), counted per document.
 */
export const satteriSlug =
  (options: SlugOptions = {}): ((ctx: PluginFactoryContext) => SlugPlugin) =>
  () => {
    const prefix = options.prefix ?? "";
    const slugger = new GithubSlugger();
    return defineHastPlugin({
      name: "slug",
      element: {
        filter: HEADINGS,
        visit(node, ctx) {
          if (node.properties.id) return;
          ctx.setProperty(
            node,
            "id",
            prefix + slugger.slug(ctx.textContent(node))
          );
        }
      }
    });
  };
