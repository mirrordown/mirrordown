import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { squeezeParagraphs } from "../../packages/mdit-squeeze-paragraphs/src";
import { attrs } from "../../packages/mdit-attrs/src";
import { rehypeSqueezeParagraphs } from "../../packages/remd-squeeze-paragraphs/src";
import { remarkAttrs } from "../../packages/remd-attrs/src";
import { satteriSqueezeParagraphs } from "../../packages/sat-squeeze-paragraphs/src";
import { normalizeHtml } from "../utils/index.js";

const md = new MarkdownIt().use(attrs).use(squeezeParagraphs);

const remd = (src: string) =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(remarkAttrs)
        .use(remarkRehype)
        .use(rehypeSqueezeParagraphs)
        .use(rehypeStringify)
        .processSync(src)
    )
  );

// Sätteri has attribute blocks built in.
const sat = (src: string) =>
  normalizeHtml(
    markdownToHtml(src, {
      features: { attributes: true, smartPunctuation: false },
      hastPlugins: [satteriSqueezeParagraphs()]
    }).html
  );

describe("squeeze-paragraphs + attrs", () => {
  it("a paragraph carrying attrs has visible content and is kept", () => {
    const input = "Some text.\n{.note}";
    const expected = '<p class="note">Some text.</p>';
    expect(normalizeHtml(md.render(input))).toBe(expected);
    expect(remd(input)).toBe(expected);
    expect(sat(input)).toBe(expected);
  });

  // markdown-it's inline token keeps the attribute block in its raw `content` after attrs consumes it, so emptiness must be judged on what renders, as rehype does.
  it("a paragraph that was only an attribute block renders nothing and is removed", () => {
    const input = "Before.\n\n{.note}\n\nAfter.";
    const expected = "<p>Before.</p><p>After.</p>";
    expect(normalizeHtml(md.render(input))).toBe(expected);
    expect(remd(input)).toBe(expected);
    expect(sat(input)).toBe(expected);
  });

  // Where the order of `md.use` calls is not the author's to set (each VS Code preview extension registers itself on activation), squeeze must still see what attrs leaves: its rule is pushed to the end of the core chain, and attrs runs in an earlier phase.
  it("markdown-it removes the residue even when squeeze is registered before attrs", () => {
    const reversed = new MarkdownIt().use(squeezeParagraphs).use(attrs);
    expect(normalizeHtml(reversed.render("Before.\n\n{.note}\n\nAfter."))).toBe(
      "<p>Before.</p><p>After.</p>"
    );
  });
});
