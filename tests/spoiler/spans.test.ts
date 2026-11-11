import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { spoiler } from "../../packages/mdit-spoiler/src";
import { del } from "../../packages/mdit-del/src";
import {
  remarkSpoiler,
  spoilerHastHandlers
} from "../../packages/remd-spoiler/src";
import { remarkDel } from "../../packages/remd-del/src";
import { satteriSpoiler } from "../../packages/sat-spoiler/src";
import { satteriDel } from "../../packages/sat-del/src";
import { normalizeHtml } from "../utils/index.js";

// markdown-it decides what a `||` is while it tokenizes, so it knows which pipes were escaped or written as references. remark and Sätteri scan the finished tree, where those are already plain characters, and have to recover the difference from the source. A spoiler that forms in one engine and not another either hides text the author meant to show or shows text the author meant to hide. del runs before spoiler, as in the presets.

const S = (content: string): string =>
  `<label class="markdown-spoiler"><input type="checkbox" class="markdown-spoiler-toggle" aria-label="spoiler"><span class="markdown-spoiler-content">${content}</span></label>`;

const md = new MarkdownIt().use(del).use(spoiler);
const mdit = (input: string): string => normalizeHtml(md.render(input));

const remarkProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkDel)
  .use(remarkSpoiler)
  .use(remarkRehype, { handlers: spoilerHastHandlers })
  .use(rehypeStringify);
const remd = (input: string): string =>
  normalizeHtml(String(remarkProcessor.processSync(input)));

const sat = (input: string, smartPunctuation = false): string =>
  normalizeHtml(
    markdownToHtml(input, {
      features: { gfm: true, frontmatter: false, smartPunctuation },
      mdastPlugins: [satteriDel(), satteriSpoiler()]
    }).html
  );

const engines = [
  ["markdown-it", mdit],
  ["remark", remd],
  ["sätteri", sat]
] as const;

type Case = [name: string, input: string, expected: string];

// A one-cell table whose body row is `row`, and the HTML of one whose body cell holds `content`.
const table = (row: string): string => `| h |\n| - |\n| ${row} |`;
const cell = (content: string): string =>
  `<table><thead><tr><th>h</th></tr></thead><tbody><tr><td>${content}</td></tr></tbody></table>`;

describe("spoiler: in a table cell `\\|` is the table's pipe, so `\\|\\|x\\|\\|` is a spoiler", () => {
  // Unescaped pipes split the row, so this is the only way to write a spoiler in a cell. The table syntax consumes the backslash; it is not an inline escape.
  const cases: Case[] = [
    [
      "beside a lone table-escaped pipe, which stays text",
      table(String.raw`a \|\|x\|\| b \| c`),
      cell(`a ${S("x")} b | c`)
    ],
    [
      "inside emphasis in the cell, where an inline escape is still honoured",
      table(String.raw`*\|\|x\|\|* \*`),
      cell(`<em>${S("x")}</em> *`)
    ],
    [
      "after another span plugin rebuilt the cell's text",
      table(String.raw`--a-- \|\|x\|\|`),
      cell(`<del>a</del> ${S("x")}`)
    ],
    [
      "but a pipe written as a reference is literal in a cell too",
      table(String.raw`&#124;&#124;x\|\|`),
      cell("||x||")
    ]
  ];

  describe.each(engines)("%s", (_engine, render) => {
    it.each(cases)("%s", (_name, input, expected) => {
      expect(render(input)).toBe(expected);
    });
  });
});
