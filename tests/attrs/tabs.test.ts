import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { tabs } from "../../packages/mdit-tabs/src";
import { attrs } from "../../packages/mdit-attrs/src";
import { remarkTabs, tabsHastHandlers } from "../../packages/remd-tabs/src";
import { remarkAttrs } from "../../packages/remd-attrs/src";
import { satteriTabs } from "../../packages/sat-tabs/src";
import { normalizeHtml } from "../utils/index.js";

const md = new MarkdownIt().use(tabs).use(attrs);
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkTabs)
  .use(remarkAttrs)
  .use(remarkRehype, { handlers: tabsHastHandlers as never })
  .use(rehypeStringify, { allowDangerousHtml: true });
const engines = [
  (src: string): string => normalizeHtml(md.render(src)),
  (src: string): string => normalizeHtml(String(processor.processSync(src))),
  (src: string): string =>
    normalizeHtml(
      markdownToHtml(src, {
        features: { gfm: true, attributes: true, smartPunctuation: false },
        mdastPlugins: [satteriTabs()]
      }).html
    )
];

// A tab panel is tokenized from its own body in markdown-it, inside the page's token stream, so a paragraph holding only a block is removed there as anywhere: once it was removed on the spot and markdown-it read on from the wrong token, skipping the one after it.
describe("attrs + tabs: a paragraph holding only a block, in a panel", () => {
  it.each([
    [
      "a fence after a table's block keeps its own",
      "% Tab\n> | a |\n> |---|\n> | b |\n>\n> {.t}\n>\n> ```js {.x}\n> code\n> ```",
      '<table class="t"><thead><tr><th>a</th></tr></thead><tbody><tr><td>b</td></tr></tbody></table><pre><code class="x language-js">code\n</code></pre>'
    ],
    [
      "two blocks after a rule both go on it",
      "% Tab\n> ---\n>\n> {.h}\n>\n> {.i}",
      '<hr class="h i">'
    ],
    [
      "three blocks after a list all go on it",
      "% Tab\n> - a\n>\n> {.l}\n>\n> {.m}\n>\n> {.n}",
      '<ul class="l m n"><li>a</li></ul>'
    ],
    [
      "a paragraph ending in a block after a list's block",
      "% Tab\n> - a\n>\n> {.l}\n>\n> para {.p}",
      '<ul class="l"><li>a</li></ul><p class="p">para</p>'
    ]
  ])("%s", (_why, input, panel) => {
    const [mdit, remd, sat] = engines.map((render) => render(input));
    expect(mdit).toContain(`aria-label="Tab">${panel}</section>`);
    expect(remd).toBe(mdit);
    expect(sat).toBe(mdit);
  });
});
