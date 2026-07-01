import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { slug } from "../../packages/mdit-slug/src";
import { attrs } from "../../packages/mdit-attrs/src";
import { autolinkHeadings } from "../../packages/mdit-autolink-headings/src";
import { rehypeSlug } from "../../packages/remd-slug/src";
import { remarkAttrs } from "../../packages/remd-attrs/src";
import { rehypeAutolinkHeadings } from "../../packages/remd-autolink-headings/src";
import { normalizeHtml } from "../utils/index.js";

// The full content pipeline: attrs (explicit ids/classes) -> slug (fills the
// rest) -> autolink (links each heading to its id).
const md = new MarkdownIt().use(attrs).use(slug).use(autolinkHeadings);

const remd = (src: string) =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(remarkAttrs)
        .use(remarkRehype)
        .use(rehypeSlug)
        .use(rehypeAutolinkHeadings)
        .use(rehypeStringify)
        .processSync(src)
    )
  );

describe("autolink-headings + slug + attrs", () => {
  it("the link targets an explicit {#custom} id", () => {
    const input = "## Heading {#custom}";
    const expected =
      '<h2 id="custom"><a class="anchor" aria-hidden="true" tabindex="-1" href="#custom"></a>Heading</h2>';
    expect(normalizeHtml(md.render(input))).toBe(expected);
    expect(remd(input)).toBe(expected);
  });

  it("a class attr and an auto slug id coexist, and the link uses the slug", () => {
    const input = "## Heading {.fancy}";
    const expected =
      '<h2 class="fancy" id="heading"><a class="anchor" aria-hidden="true" tabindex="-1" href="#heading"></a>Heading</h2>';
    expect(normalizeHtml(md.render(input))).toBe(expected);
    expect(remd(input)).toBe(expected);
  });
});
