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

describe("spoiler: a pipe the author wrote as literal never opens or closes a spoiler", () => {
  const cases: Case[] = [
    [
      "a pipe written as a character reference is not a delimiter",
      "&#124;|x||",
      "<p>||x||</p>"
    ],
    [
      "two referenced pipes do not open a spoiler",
      "&vert;&vert;text||",
      "<p>||text||</p>"
    ],
    [
      "an escaped pipe after an astral character reference stays escaped",
      String.raw`&#x1F600; \||a||`,
      "<p>😀 ||a||</p>"
    ],
    [
      "an escape still counts after another span plugin rebuilt the text",
      String.raw`--a-- \||b||`,
      "<p><del>a</del> ||b||</p>"
    ],
    [
      "the text of an autolink is never scanned",
      "<http://x/||b||>",
      '<p><a href="http://x/%7C%7Cb%7C%7C">http://x/||b||</a></p>'
    ],
    [
      "outside a table, backslashed pipes are escaped",
      String.raw`\|\|x\|\|`,
      "<p>||x||</p>"
    ]
  ];

  describe.each(engines)("%s", (_engine, render) => {
    it.each(cases)("%s", (_name, input, expected) => {
      expect(render(input)).toBe(expected);
    });
  });
});

describe("spoiler: flanking reads an escaped or referenced neighbour as the character it is", () => {
  // A closing `||` after punctuation and before a letter cannot close, and an opening one after a letter and before punctuation cannot open. An escaped `*` is still punctuation and a referenced `ä` is still a letter.
  const cases: Case[] = [
    [
      "an escaped punctuation mark before the closer",
      String.raw`||a \*||b`,
      "<p>||a *||b</p>"
    ],
    [
      "an escaped punctuation mark after the opener",
      String.raw`a||\*b||`,
      "<p>a||*b||</p>"
    ],
    [
      "a referenced letter after the opener lets it open",
      "a ||&auml;b||",
      `<p>a ${S("äb")}</p>`
    ]
  ];

  describe.each(engines)("%s", (_engine, render) => {
    it.each(cases)("%s", (_name, input, expected) => {
      expect(render(input)).toBe(expected);
    });
  });
});

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

describe("spoiler (sätteri): smart punctuation before an escape does not lose it", () => {
  // Smart punctuation puts characters in the text that the source does not have (`"` becomes a curly quote). Losing the alignment there read every later `\||` as a real delimiter and hid text the author escaped.
  it("keeps an escaped opener literal after curly quotes", () => {
    expect(sat(String.raw`"q" \||a||`, true)).toBe("<p>“q” ||a||</p>");
  });
});

describe("spoiler: a spoiler that crosses emphasis is malformed, and each engine resolves it its own way", () => {
  // markdown-it pairs `||` and `*` from one delimiter list, so the pair that closes first wins. remark and Sätteri scan after the parser has made the emphasis node, which leaves the two `||` in different parents. The guide documents the difference; these pin both outcomes so a change to either is noticed.
  const crossing = "||a *b|| c*";

  it("markdown-it forms the spoiler and leaves the emphasis literal", () => {
    expect(mdit(crossing)).toBe(`<p>${S("a *b")} c*</p>`);
  });

  it.each([
    ["remark", remd],
    ["sätteri", sat]
  ] as const)(
    "%s forms the emphasis and leaves the spoiler literal",
    (_engine, render) => {
      expect(render(crossing)).toBe("<p>||a <em>b|| c</em></p>");
    }
  );

  it.each(engines)(
    "%s agrees when the emphasis opens first: the emphasis wins",
    (_engine, render) => {
      expect(render("*a ||b* c||")).toBe("<p><em>a ||b</em> c||</p>");
    }
  );
});

describe("spoiler: a table-cell spoiler nested in emphasis after another span plugin's span", () => {
  // sat-del rebuilds the emphasis's text and records which of its characters were escaped. In a table cell `\|` is the table's pipe and not an escape, however far up the cell is: a span plugin that looked only at the direct parent (the emphasis) recorded the pipes as escaped, and sat-spoiler, which runs after it, left the spoiler literal.
  const input = table(String.raw`*--a-- \|\|x\|\|*`);

  it.each(engines)("%s forms the spoiler", (_engine, render) => {
    expect(render(input)).toBe(cell(`<em><del>a</del> ${S("x")}</em>`));
  });
});
