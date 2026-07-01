import GithubSlugger from "github-slugger";
import type { PluginWithOptions } from "markdown-it";
import type Token from "markdown-it/lib/token.mjs";

export interface SlugOptions {
  /** Prefix to add in front of every generated `id` (default: `""`). */
  prefix?: string;
}

// Concatenate the slug-relevant text of a heading's inline token. Mirrors
// hast-util-to-string (used by remd-slug) rather than markdown-it's
// `renderInlineAsText`: include `text` and inline `code`, but NOT image `alt`
// (an `<img>` contributes no text content in hast), so both engines slug the
// same input.
const headingText = (inline: Token): string => {
  let text = "";
  for (const token of inline.children ?? []) {
    if (token.type === "text" || token.type === "code_inline") {
      text += token.content;
    }
  }
  return text;
};

/**
 * markdown-it plugin that adds GitHub-style `id` slugs to headings, derived
 * from their text content via
 * {@link https://github.com/Flet/github-slugger | github-slugger}.
 *
 * Headings that already carry an `id` (e.g. from markdown-it-attrs' `{#custom}`)
 * are left untouched. Repeated heading text dedupes with a numeric suffix
 * (`heading`, `heading-1`, …). Mirrors `@mirrordown/remd-slug`.
 */
export const slug: PluginWithOptions<SlugOptions> = (md, options) => {
  const prefix = options?.prefix ?? "";
  const slugger = new GithubSlugger();

  // Runs after `curly_attributes` (markdown-it-attrs) when present, so an
  // explicit `{#custom}` id is already on the heading and wins here.
  md.core.ruler.push("slug", (state) => {
    slugger.reset();

    let prev: Token | undefined;
    for (const token of state.tokens) {
      if (
        prev?.type === "heading_open" &&
        token.type === "inline" &&
        prev.attrGet("id") === null
      ) {
        prev.attrSet("id", prefix + slugger.slug(headingText(token)));
      }
      prev = token;
    }
  });
};
