import { expect, it, describe } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { tabs } from "../../packages/mdit-tabs/src";
import { mark } from "../../packages/mdit-mark/src";
import { remarkTabs, tabsHastHandlers } from "../../packages/remd-tabs/src";
import { remarkMark } from "../../packages/remd-mark/src";
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

describe("tabs + mark: mark in a tab label, with mark running after tabs", () => {
  const input = "% A ==marked== label\n> Body.";

  it.each([
    ["markdown-it", (src: string) => normalizeHtml(md.render(src))],
    ["remark", remd]
  ])("%s", (_, render) => {
    const html = render(input);
    expect(html).toContain(
      '<label class="markdown-tabs-label" for="tabs-ab137af7-0">A <mark>marked</mark> label</label>'
    );
    expect(html).toContain('aria-label="A marked label"');
  });
});
