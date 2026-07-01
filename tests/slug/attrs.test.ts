import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { slug } from "../../packages/mdit-slug/src";
import { attrs } from "../../packages/mdit-attrs/src";
import { rehypeSlug } from "../../packages/remd-slug/src";
import { remarkAttrs } from "../../packages/remd-attrs/src";
import { normalizeHtml } from "../utils/index.js";

const md = new MarkdownIt().use(attrs).use(slug);

// remarkAttrs sets ids/classes on the mdast tree; rehypeSlug then runs on hast
// and must respect any id attrs already produced.
const remd = (src: string) =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(remarkAttrs)
        .use(remarkRehype)
        .use(rehypeSlug)
        .use(rehypeStringify)
        .processSync(src)
    )
  );

describe("slug + attrs", () => {
  it("an explicit {#custom} id is not overwritten by the slug", () => {
    const input = "## Heading {#custom}";
    const expected = '<h2 id="custom">Heading</h2>';
    expect(normalizeHtml(md.render(input))).toBe(expected);
    expect(remd(input)).toBe(expected);
  });

  it("a heading with only a class attr still gets a slug id", () => {
    const input = "## Heading {.fancy}";
    const expected = '<h2 class="fancy" id="heading">Heading</h2>';
    expect(normalizeHtml(md.render(input))).toBe(expected);
    expect(remd(input)).toBe(expected);
  });
});
