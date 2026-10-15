import { expect, it, describe } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { tabs } from "../../packages/mdit-tabs/src";
import { mark } from "../../packages/mdit-mark/src";
import { remarkTabs, tabsHastHandlers } from "../../packages/remd-tabs/src";
import { remarkMark } from "../../packages/remd-mark/src";
import { satteriTabs } from "../../packages/sat-tabs/src";
import { satteriMark } from "../../packages/sat-mark/src";
import { normalizeHtml } from "../utils/index.js";

// Mark runs after tabs here: tabs keeps a tab's label in the tree, so a plugin that runs after it still reaches the label, and the panel's aria-label is the label's final text.
const md = new MarkdownIt().use(tabs).use(mark);

const remd = (src: string) =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(remarkTabs)
        .use(remarkMark)
        .use(remarkRehype, { handlers: tabsHastHandlers as never })
        .use(rehypeStringify)
        .processSync(src)
    )
  );

const sat = (src: string) =>
  normalizeHtml(
    markdownToHtml(src, {
      features: { gfm: false, frontmatter: false, smartPunctuation: false },
      mdastPlugins: [satteriTabs(), satteriMark()]
    }).html
  );

describe("tabs + mark: mark in a tab label, with mark running after tabs", () => {
  const input = "% A ==marked== label\n> Body.";

  const label =
    '<label class="markdown-tabs-label" for="tabs-ab137af7-0">A <mark>marked</mark> label</label>';

  it.each([
    ["markdown-it", (src: string) => normalizeHtml(md.render(src))],
    ["remark", remd]
  ])("%s", (_, render) => {
    const html = render(input);
    expect(html).toContain(label);
    expect(html).toContain('aria-label="A marked label"');
  });

  // A Sätteri plugin renders during its own turn, and nothing runs after the plugins that follow it but hast plugins, so the panel's aria-label keeps the label as tabs recognized it. The presets run tabs after the inline plugins, so this only shows in a pipeline ordered like this one.
  it("in Sätteri, the label gets the mark and the aria-label keeps the recognized text", () => {
    const html = sat(input);
    expect(html).toContain(label);
    expect(html).toContain('aria-label="A ==marked== label"');
  });
});
