import GithubSlugger from "github-slugger";
import type { PluginWithOptions } from "markdown-it";
import type Token from "markdown-it/lib/token.mjs";

export interface SlugOptions {
  /** Prefix to add in front of every generated `id` (default: `""`). */
  prefix?: string;
}

// A token's content that is not text a reader sees: an image's is its alt (an attribute; an `<img>` has no text content in hast), and inline HTML's is markup (a raw node, which has none either).
const NOT_TEXT = new Set(["image", "html_inline"]);

// The text of a heading a reader sees, as hast-util-to-string gives it to the rehype and Sätteri plugins (not markdown-it's `renderInlineAsText`, which includes image alt), so the three engines slug the same input. Every other token's content counts, whatever plugin made it: text, inline code, and what a plugin renders from a token of its own (a ruby's fallback parentheses), where a list of known types would silently leave a new one out.
const headingText = (inline: Token): string => {
  let text = "";
  for (const token of inline.children ?? []) {
    if (!NOT_TEXT.has(token.type)) text += token.content;
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

    // An id a heading was given by hand is taken, wherever in the document it is written: the slugger is told of each before it makes any, so a generated id never repeats one.
    for (const token of state.tokens) {
      const id = token.type === "heading_open" ? token.attrGet("id") : null;
      if (id?.startsWith(prefix)) {
        slugger.occurrences[id.slice(prefix.length)] ??= 0;
      }
    }

    let prev: Token | undefined;
    for (const token of state.tokens) {
      if (
        prev?.type === "heading_open" &&
        token.type === "inline" &&
        // An empty id is no id, as in the rehype and Sätteri plugins.
        !prev.attrGet("id")
      ) {
        prev.attrSet("id", prefix + slugger.slug(headingText(token)));
      }
      prev = token;
    }
  });
};
