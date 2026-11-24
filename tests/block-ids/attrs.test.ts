import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { attrs } from "../../packages/mdit-attrs/src";
import { blockIds } from "../../packages/mdit-block-ids/src";
import { remarkAttrs } from "../../packages/remd-attrs/src";
import { remarkBlockIds } from "../../packages/remd-block-ids/src";
import { satteriBlockIds } from "../../packages/sat-block-ids/src";
import { normalizeHtml } from "../utils/index.js";

const md = new MarkdownIt().use(attrs).use(blockIds);
const processor = unified()
  .use(remarkParse)
  .use(remarkAttrs)
  .use(remarkBlockIds)
  .use(remarkRehype)
  .use(rehypeStringify);

const engines = [
  ["markdown-it", (input: string) => normalizeHtml(md.render(input))],
  [
    "remark",
    (input: string) => normalizeHtml(String(processor.processSync(input)))
  ],
  [
    "Sätteri",
    (input: string) =>
      normalizeHtml(
        markdownToHtml(input, {
          features: {
            gfm: false,
            attributes: true,
            frontmatter: false,
            smartPunctuation: false
          },
          mdastPlugins: [satteriBlockIds()]
        }).html
      )
  ]
] as const;

// Rule 6: an id the author wrote with an attribute block is the block's, and a marker that names the block is only removed. Attrs takes its block off the end first (markdown-it's attrs rule runs before this plugin's, remark-attrs is listed before it, Sätteri reads attribute blocks while it parses), so a marker before an attribute block ends the block. Other attributes stay beside the marker's id.
describe.each(engines)("block-ids with attrs (%s)", (_, render) => {
  it.each([
    {
      name: "an id on its own line after the block wins",
      input: "text ^blk\n{#name}",
      expected: '<p id="name">text</p>'
    },
    {
      name: "an id after the marker on its line wins",
      input: "text ^blk {#name}",
      expected: '<p id="name">text</p>'
    },
    {
      name: "a heading's id wins",
      input: "# Head ^h {#name}",
      expected: '<h1 id="name">Head</h1>'
    },
    {
      name: "a class beside the marker joins its id",
      input: "text ^blk {.cls}",
      expected: '<p class="cls" id="^blk">text</p>'
    },
    {
      name: "other attributes beside the marker join its id",
      input: 'text ^blk {data-x="1"}',
      expected: '<p data-x="1" id="^blk">text</p>'
    },
    {
      name: "an attribute block before the marker is text, as it does not end the block",
      input: "text {.cls} ^blk",
      expected: '<p id="^blk">text {.cls}</p>'
    },
    {
      name: "a list's id and its item's marker name different elements",
      input: "- a ^x\n{#list}",
      expected: '<ul id="list"><li id="^x">a</li></ul>'
    },
    {
      name: "a quote's id wins over a marker inside it",
      input: "> quote ^q\n{#name}",
      expected: '<blockquote id="name"><p>quote</p></blockquote>'
    },
    {
      name: "a marker alone after a block with an id is only removed",
      input: "para {#a}\n\n^b",
      expected: '<p id="a">para</p>'
    }
  ])("$name", ({ input, expected }) => {
    expect(render(input)).toBe(expected);
  });
});
