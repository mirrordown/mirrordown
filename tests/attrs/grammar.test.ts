import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { attrs } from "../../packages/mdit-attrs/src";
import { remarkAttrs } from "../../packages/remd-attrs/src";
import { normalizeHtml } from "../utils/index.js";

// Sätteri reads attribute blocks itself (its built-in `attributes` feature), and that reader can't be changed from here. So it is the reference for what a block is: these cases pin mdit-attrs and remd-attrs to it, on input the fixtures don't reach.
const md = new MarkdownIt().use(attrs);
const engines: Array<[string, (src: string) => string]> = [
  ["markdown-it", (src) => normalizeHtml(md.render(src))],
  [
    "remark",
    (src) =>
      normalizeHtml(
        String(
          unified()
            .use(remarkParse)
            .use(remarkGfm)
            .use(remarkAttrs)
            .use(remarkRehype)
            .use(rehypeStringify)
            .processSync(src)
        )
      )
  ],
  [
    "sätteri",
    (src) =>
      normalizeHtml(
        markdownToHtml(src, {
          features: { gfm: true, attributes: true, smartPunctuation: false }
        }).html
      )
  ]
];

type Case = [why: string, input: string, expected: string];

// An element can't carry the same attribute twice: the HTML is invalid and browsers keep the first one, so an engine that appended would show a different value than one that replaced.
const repeated: Case[] = [
  ["a repeated id keeps the last", "text {#a #b}", '<p id="b">text</p>'],
  [
    "a repeated key keeps the last",
    "text {data-x=1 data-x=2}",
    '<p data-x="2">text</p>'
  ],
  [
    "a link's own href is replaced, not doubled",
    "[x](/a){href=/b}",
    '<p><a href="/b">x</a></p>'
  ],
  [
    "an image's own src is replaced in place",
    "![a](x.png){src=y.png}",
    '<p><img src="y.png" alt="a"></p>'
  ],
  ["classes still add up", "text {.a class=b .c}", '<p class="a b c">text</p>']
];

describe.each(engines)("attrs/grammar (%s)", (_engine, render) => {
  it.each(repeated)("one attribute per name: %s", (_why, input, expected) => {
    expect(render(input)).toBe(expected);
  });
});
