import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified, type PluggableList } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { sectionize } from "../../packages/mdit-sectionize/src";
import { slug } from "../../packages/mdit-slug/src";
import { autolinkHeadings } from "../../packages/mdit-autolink-headings/src";
import { rehypeSectionize } from "../../packages/remd-sectionize/src";
import { rehypeSlug } from "../../packages/remd-slug/src";
import { rehypeAutolinkHeadings } from "../../packages/remd-autolink-headings/src";
import { satteriSectionize } from "../../packages/sat-sectionize/src";
import { satteriSlug } from "../../packages/sat-slug/src";
import { satteriAutolinkHeadings } from "../../packages/sat-autolink-headings/src";
import { normalizeHtml } from "../utils/index.js";

// `before` (like `after` and `group`) makes autolink-headings add a sibling next to the heading, which is the output that depends on where sectionize runs.
const options = { behavior: "before" } as const;

const mdit = (src: string) =>
  normalizeHtml(
    new MarkdownIt()
      .use(sectionize)
      .use(slug)
      .use(autolinkHeadings, options)
      .render(src)
  );

const remd = (plugins: PluggableList) => (src: string) =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(remarkRehype)
        .use(plugins)
        .use(rehypeStringify)
        .processSync(src)
    )
  );

const sat = (sectionizeFirst: boolean) => (src: string) => {
  const linking = [satteriSlug(), satteriAutolinkHeadings(options)];
  return normalizeHtml(
    markdownToHtml(src, {
      features: { gfm: false, frontmatter: false, smartPunctuation: false },
      hastPlugins: sectionizeFirst
        ? [satteriSectionize(), ...linking]
        : [...linking, satteriSectionize()]
    }).html
  );
};

describe("sectionize + autolink-headings", () => {
  const input = "# A\n\ntext\n\n## B\n\nmore";

  // The documented order. The anchor has to be created inside the section its heading opens, or it is no longer next to the heading it links to.
  it.each([
    ["markdown-it", mdit],
    [
      "remark",
      remd([rehypeSectionize, rehypeSlug, [rehypeAutolinkHeadings, options]])
    ],
    ["Sätteri", sat(true)]
  ])(
    "%s: with sectionize listed first, a sibling anchor sits inside its heading's section",
    (_, render) => {
      expect(render(input)).toBe(
        '<section data-depth="1"><a class="anchor" href="#a"></a><h1 id="a">A</h1><p>text</p>' +
          '<section data-depth="2"><a class="anchor" href="#b"></a><h2 id="b">B</h2><p>more</p></section></section>'
      );
    }
  );

  // Why the order is required: listed after autolink-headings, sectionize sees the anchor as ordinary content ahead of the heading, so it lands in the previous section (or outside every section). If this stops holding, the order no longer matters and the guide's tip should say so.
  it.each([
    [
      "remark",
      remd([rehypeSlug, [rehypeAutolinkHeadings, options], rehypeSectionize])
    ],
    ["Sätteri", sat(false)]
  ])(
    "%s: with sectionize listed last, the anchor is left outside its heading's section",
    (_, render) => {
      expect(render(input)).toBe(
        '<a class="anchor" href="#a"></a><section data-depth="1"><h1 id="a">A</h1><p>text</p>' +
          '<a class="anchor" href="#b"></a><section data-depth="2"><h2 id="b">B</h2><p>more</p></section></section>'
      );
    }
  );
});
