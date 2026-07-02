import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { sectionize } from "../../packages/mdit-sectionize/src";
import { attrs } from "../../packages/mdit-attrs/src";
import { rehypeSectionize } from "../../packages/remd-sectionize/src";
import { remarkAttrs } from "../../packages/remd-attrs/src";
import { normalizeHtml } from "../utils/index.js";

const md = new MarkdownIt().use(attrs).use(sectionize);

const remd = (src: string) =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(remarkAttrs)
        .use(remarkRehype)
        .use(rehypeSectionize)
        .use(rehypeStringify)
        .processSync(src)
    )
  );

describe("sectionize + attrs", () => {
  it("an explicit heading id survives being wrapped in a section", () => {
    const input = "## Heading {#custom}\n\nbody";
    const expected =
      '<section data-depth="2"><h2 id="custom">Heading</h2><p>body</p></section>';
    expect(normalizeHtml(md.render(input))).toBe(expected);
    expect(remd(input)).toBe(expected);
  });

  it("a heading class survives being wrapped in a section", () => {
    const input = "## Heading {.fancy}";
    const expected =
      '<section data-depth="2"><h2 class="fancy">Heading</h2></section>';
    expect(normalizeHtml(md.render(input))).toBe(expected);
    expect(remd(input)).toBe(expected);
  });
});
