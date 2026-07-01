import { visit } from "unist-util-visit";
import GithubSlugger from "github-slugger";
import type { Element, Nodes, Root } from "hast";
import type { Plugin } from "unified";

export interface SlugOptions {
  /** Prefix to add in front of every generated `id` (default: `""`). */
  prefix?: string;
}

// Inlined from hast-util-heading-rank: maps `h1`–`h6` to `1`–`6`, else
// `undefined` for any other element.
const headingRank = (node: Element): number | undefined => {
  const name = node.tagName.toLowerCase();
  const code =
    name.length === 2 && name.charCodeAt(0) === 104 /* h */
      ? name.charCodeAt(1)
      : 0;
  return code > 48 && code < 55 /* 1–6 */ ? code - 48 : undefined;
};

// Inlined from hast-util-to-string: the concatenated text content of a node.
// An `<img>` (an element with no children) contributes nothing — mdit-slug
// mirrors this so the two engines slug identically.
const toString = (node: Nodes): string => {
  if (node.type === "text") return node.value;
  if ("children" in node) {
    let result = "";
    for (const child of node.children) result += toString(child);
    return result;
  }
  return "";
};

/**
 * rehype plugin that adds GitHub-style `id` slugs to headings (`h1`–`h6`),
 * derived from their text content via {@link https://github.com/Flet/github-slugger | github-slugger}.
 *
 * Headings that already carry an `id` are left untouched, so an explicit
 * `{#custom}` (via markdown-it-attrs / a `data` id) always wins. Repeated
 * heading text dedupes with a numeric suffix (`heading`, `heading-1`, …).
 */
export const rehypeSlug: Plugin<[SlugOptions?], Root> = (options) => {
  const prefix = options?.prefix ?? "";
  const slugger = new GithubSlugger();

  return (tree) => {
    slugger.reset();

    visit(tree, "element", (node) => {
      if (headingRank(node) !== undefined && !node.properties.id) {
        node.properties.id = prefix + slugger.slug(toString(node));
      }
    });
  };
};
