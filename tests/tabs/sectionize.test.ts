import { expect, it, describe } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { tabs } from "../../packages/mdit-tabs/src";
import { sectionize } from "../../packages/mdit-sectionize/src";
import { remarkTabs, tabsHastHandlers } from "../../packages/remd-tabs/src";
import { rehypeSectionize } from "../../packages/remd-sectionize/src";
import { satteriTabs } from "../../packages/sat-tabs/src";
import { satteriSectionize } from "../../packages/sat-sectionize/src";
import { normalizeHtml } from "../utils/index.js";

const md = new MarkdownIt().use(tabs).use(sectionize);

const remd = (src: string) =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(remarkTabs)
        .use(remarkRehype, { handlers: tabsHastHandlers as never })
        .use(rehypeSectionize)
        .use(rehypeStringify)
        .processSync(src)
    )
  );

const sat = (src: string) =>
  normalizeHtml(
    markdownToHtml(src, {
      features: { gfm: false, frontmatter: false, smartPunctuation: false },
      mdastPlugins: [satteriTabs()],
      hastPlugins: [satteriSectionize()]
    }).html
  );

// Sections only group top-level headings: a section opened around a heading in a tab panel would close outside the panel, which is invalid HTML.
describe("tabs + sectionize: a heading in a tab panel stays inside the panel", () => {
  const input = "# Guide\n\n% One\n> ## Inside\n> Body.\n% Two\n> Other.";
  const panel =
    '<section class="markdown-tabs-panel" aria-label="One"><h2>Inside</h2><p>Body.</p></section>';

  it.each([
    ["markdown-it", (src: string) => normalizeHtml(md.render(src))],
    ["remark", remd],
    ["Sätteri", sat]
  ])("%s", (_, render) => {
    const html = render(input);
    expect(html).toContain(panel);
    expect(html).toMatch(
      /^<section data-depth="1"><h1>Guide<\/h1>.*<\/div><\/section>$/
    );
  });
});
