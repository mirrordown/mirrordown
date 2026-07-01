import type MarkdownIt from "markdown-it";
import { slug } from "@mirrordown/mdit-slug";
import { autolinkHeadings } from "@mirrordown/mdit-autolink-headings";

// The extension bundles `slug` so it is self-contained: headings get ids first,
// then `autolinkHeadings` links each one to its id. VSCode's preview also adds
// heading ids (via the same GitHub slug algorithm), so the ids match and the
// doubled computation is harmless; scroll-sync is unaffected since it relies on
// `data-line` attributes, not ids.
export const activate = (): {
  extendMarkdownIt: (md: MarkdownIt) => MarkdownIt;
} => ({
  extendMarkdownIt: (md: MarkdownIt): MarkdownIt =>
    md.use(slug).use(autolinkHeadings)
});
