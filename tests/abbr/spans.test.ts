import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { abbr } from "../../packages/mdit-abbr/src";
import { del } from "../../packages/mdit-del/src";
import { mark } from "../../packages/mdit-mark/src";
import { remarkAbbr } from "../../packages/remd-abbr/src";
import { remarkDel } from "../../packages/remd-del/src";
import { remarkMark } from "../../packages/remd-mark/src";
import { satteriAbbr } from "../../packages/sat-abbr/src";
import { satteriDel } from "../../packages/sat-del/src";
import { satteriMark } from "../../packages/sat-mark/src";
import { normalizeHtml } from "../utils/index.js";

// markdown-it applies abbreviations after inline parsing, so its span plugins read the raw source and see every escape. In remark and Sätteri abbr runs first (the presets' order) and replaces a text node with pieces that have no source position. The span plugins after it can only tell `\==` from `==` if those pieces carry which of their characters were escaped.

const md = new MarkdownIt().use(abbr).use(del).use(mark);
const mdit = (input: string): string => normalizeHtml(md.render(input));

const remarkProcessor = unified()
  .use(remarkParse)
  .use(remarkAbbr)
  .use(remarkDel)
  .use(remarkMark)
  .use(remarkRehype)
  .use(rehypeStringify);
const remd = (input: string): string =>
  normalizeHtml(String(remarkProcessor.processSync(input)));

const sat = (input: string): string =>
  normalizeHtml(
    markdownToHtml(input, {
      features: { gfm: false, frontmatter: false, smartPunctuation: false },
      mdastPlugins: [satteriAbbr(), satteriDel(), satteriMark()]
    }).html
  );

const engines = [
  ["markdown-it", mdit],
  ["remark", remd],
  ["sätteri", sat]
] as const;

const HTML = '<abbr title="Hyper Text">HTML</abbr>';
const definition = "*[HTML]: Hyper Text\n\n";

const cases: [name: string, input: string, expected: string][] = [
  [
    "an escaped delimiter after an abbreviation stays text",
    `${definition}HTML \\==a==`,
    `<p>${HTML} ==a==</p>`
  ],
  [
    "an escaped delimiter before an abbreviation stays text",
    `${definition}\\--a-- HTML`,
    `<p>--a-- ${HTML}</p>`
  ],
  [
    "a delimiter written as a character reference stays text",
    `${definition}HTML &#61;=a==`,
    `<p>${HTML} ==a==</p>`
  ],
  [
    "an unescaped delimiter in the same text still forms its span",
    `${definition}HTML \\==a== ==b==`,
    `<p>${HTML} ==a== <mark>b</mark></p>`
  ],
  [
    "an escape between two abbreviations stays with its own piece",
    `${definition}HTML \\--a-- HTML --b--`,
    `<p>${HTML} --a-- ${HTML} <del>b</del></p>`
  ]
];

describe.each(engines)(
  "abbr before the span plugins: an escape outlives the split (%s)",
  (_engine, render) => {
    it.each(cases)("%s", (_name, input, expected) => {
      expect(render(input)).toBe(expected);
    });
  }
);
