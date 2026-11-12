import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { abbr } from "../../packages/mdit-abbr/src";
import { attrs } from "../../packages/mdit-attrs/src";
import { del } from "../../packages/mdit-del/src";
import { ins } from "../../packages/mdit-ins/src";
import { kbd } from "../../packages/mdit-kbd/src";
import { mark } from "../../packages/mdit-mark/src";
import { ruby } from "../../packages/mdit-ruby/src";
import { spoiler } from "../../packages/mdit-spoiler/src";
import { remarkAbbr } from "../../packages/remd-abbr/src";
import { remarkAttrs } from "../../packages/remd-attrs/src";
import { remarkDel } from "../../packages/remd-del/src";
import { remarkIns } from "../../packages/remd-ins/src";
import { remarkKbd } from "../../packages/remd-kbd/src";
import { remarkMark } from "../../packages/remd-mark/src";
import { remarkRuby } from "../../packages/remd-ruby/src";
import {
  remarkSpoiler,
  spoilerHastHandlers
} from "../../packages/remd-spoiler/src";
import { satteriAbbr } from "../../packages/sat-abbr/src";
import { satteriDel } from "../../packages/sat-del/src";
import { satteriIns } from "../../packages/sat-ins/src";
import { satteriKbd } from "../../packages/sat-kbd/src";
import { satteriMark } from "../../packages/sat-mark/src";
import { satteriRuby } from "../../packages/sat-ruby/src";
import { satteriSpoiler } from "../../packages/sat-spoiler/src";
import { normalizeHtml } from "../utils/index.js";

// Sätteri reads attribute blocks while it parses, before a plugin builds its spans, so the span plugins take back the blocks written right after a span (`packages/core/src/span-attributes.ts`). Each set's `attrs.test.ts` holds its own span to the other engines' output; these are the cases that need more than one plugin, or that pin what the shared code relies on. The plugins are listed in the order the presets list them.

const md = new MarkdownIt()
  .use(ruby)
  .use(abbr)
  .use(del)
  .use(ins)
  .use(kbd)
  .use(mark)
  .use(spoiler)
  .use(attrs);
const mdit = (input: string): string => normalizeHtml(md.render(input));

const remarkProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRuby)
  .use(remarkAbbr)
  .use(remarkDel)
  .use(remarkIns)
  .use(remarkKbd)
  .use(remarkMark)
  .use(remarkSpoiler)
  .use(remarkAttrs)
  .use(remarkRehype, { handlers: spoilerHastHandlers })
  .use(rehypeStringify);
const remd = (input: string): string =>
  normalizeHtml(String(remarkProcessor.processSync(input)));

const sat = (input: string): string =>
  normalizeHtml(
    markdownToHtml(input, {
      features: {
        gfm: true,
        frontmatter: false,
        smartPunctuation: false,
        attributes: true
      },
      mdastPlugins: [
        satteriRuby(),
        satteriAbbr(),
        satteriDel(),
        satteriIns(),
        satteriKbd(),
        satteriMark(),
        satteriSpoiler()
      ]
    }).html
  );

const engines = [
  ["markdown-it", mdit],
  ["remark", remd],
  ["sätteri", sat]
] as const;

const SPOILER = (inner: string): string =>
  `<label class="markdown-spoiler"><input type="checkbox" class="markdown-spoiler-toggle" aria-label="spoiler"><span class="markdown-spoiler-content">${inner}</span></label>`;
const RUBY = (attributes = ``): string =>
  `<ruby${attributes}>漢字<rt>かんじ</rt></ruby>`;

type Case = [name: string, input: string, expected: string];

// A span plugin that runs after another has rewritten the paragraph finds text nodes without a source position. Whether the block that ended the paragraph touched the span is read from the paragraph's own source, which no plugin changes, so the order plugins run in does not decide who gets the block.
describe("span attributes: a block that ends the paragraph, after an earlier plugin rewrote it", () => {
  const cases: Case[] = [
    [
      "a mark after a del",
      "--a-- and ==b=={.c}",
      '<p><del>a</del> and <mark class="c">b</mark></p>'
    ],
    [
      "a del after a mark",
      "==b== and --a--{.c}",
      '<p><mark>b</mark> and <del class="c">a</del></p>'
    ],
    [
      "a kbd after a ruby",
      "{漢字|かんじ} then [[Ctrl]]{.c}",
      `<p>${RUBY()} then <kbd class="c">Ctrl</kbd></p>`
    ],
    [
      "an ins after an abbreviation",
      "*[HTML]: Hyper Text Markup Language\n\nHTML is ++new++{.c}",
      '<p><abbr title="Hyper Text Markup Language">HTML</abbr> is <ins class="c">new</ins></p>'
    ],
    [
      "a mark inside a del takes the block inside, the del the one after",
      "--a ==b=={.c} d--{.e}",
      '<p><del class="e">a <mark class="c">b</mark> d</del></p>'
    ],
    [
      "a ruby inside a mark",
      "=={漢字|かんじ}{.r}=={.m} tail",
      `<p><mark class="m">${RUBY(' class="r"')}</mark> tail</p>`
    ]
  ];

  describe.each(cases)("%s", (_name, input, expected) => {
    it.each(engines)("%s", (_engine, render) => {
      expect(render(input)).toBe(expected);
    });
  });
});

// The parser gives a paragraph the classes of every block it reads off it, so a span's block is taken back by value: the paragraph keeps what was written for it.
describe("span attributes: the paragraph keeps its own block when the span takes one", () => {
  const cases: Case[] = [
    [
      "the same class on both",
      "--a--{.c}\n{.c}",
      '<p class="c"><del class="c">a</del></p>'
    ],
    [
      "in a list item inside a blockquote, where the item holds the classes",
      "> - --a--{.c}\n>   {.p}",
      '<blockquote><ul><li class="p"><del class="c">a</del></li></ul></blockquote>'
    ],
    [
      "under Windows line endings",
      "--a--{.c}\r\n{.p}\r\n",
      '<p class="p"><del class="c">a</del></p>'
    ]
  ];

  describe.each(cases)("%s", (_name, input, expected) => {
    it.each(engines)("%s", (_engine, render) => {
      expect(render(input)).toBe(expected);
    });
  });
});

// An escaped `{` is a brace the author wants printed, and markdown-it reads no block that holds an escaped character. remark is left out for the delimiter spans: remd-attrs reads the block there (`<del class="c">`), which is its to fix.
describe("span attributes: an escaped block stays text", () => {
  const cases: Case[] = [
    [
      "an escaped opening brace",
      String.raw`--a--\{.c} tail`,
      "<p><del>a</del>{.c} tail</p>"
    ],
    [
      "an escaped character inside the block",
      String.raw`--a--{.c\_d} tail`,
      "<p><del>a</del>{.c_d} tail</p>"
    ],
    [
      "an escaped block after one that is not",
      String.raw`--a--{.b}{.c\_d} tail`,
      '<p><del class="b">a</del>{.c_d} tail</p>'
    ]
  ];

  describe.each(cases)("after a del: %s", (_name, input, expected) => {
    it.each([
      ["markdown-it", mdit],
      ["sätteri", sat]
    ] as const)("%s", (_engine, render) => {
      expect(render(input)).toBe(expected);
    });
  });

  const rubyCases: Case[] = [
    [
      "an escaped opening brace",
      String.raw`{漢字|かんじ}\{.c} tail`,
      `<p>${RUBY()}{.c} tail</p>`
    ],
    [
      "an escaped block after one that is not",
      String.raw`{漢字|かんじ}{.b}{.c\_d} tail`,
      `<p>${RUBY(' class="b"')}{.c_d} tail</p>`
    ]
  ];

  describe.each(rubyCases)("after a ruby: %s", (_name, input, expected) => {
    it.each(engines)("%s", (_engine, render) => {
      expect(render(input)).toBe(expected);
    });
  });
});

// In a table cell `\|` is the table's way to write a pipe, not an escape, however far up the cell is. A span plugin that rebuilds the text of an emphasis inside a cell records which characters were escaped for the plugins after it, and must not record the pipes: the spoiler plugin, which runs last, would leave the spoiler literal.
describe("span plugins: a table cell's pipes are not escapes to the plugin that rebuilds its text", () => {
  const table = (content: string): string => `| h |\n| - |\n| ${content} |`;
  const cell = (content: string): string =>
    `<table><thead><tr><th>h</th></tr></thead><tbody><tr><td>${content}</td></tr></tbody></table>`;
  const cases: Case[] = [
    [
      "del",
      String.raw`*--a-- \|\|x\|\|*`,
      `<em><del>a</del> ${SPOILER("x")}</em>`
    ],
    [
      "ins",
      String.raw`*++a++ \|\|x\|\|*`,
      `<em><ins>a</ins> ${SPOILER("x")}</em>`
    ],
    [
      "mark",
      String.raw`*==a== \|\|x\|\|*`,
      `<em><mark>a</mark> ${SPOILER("x")}</em>`
    ],
    [
      "kbd",
      String.raw`*[[a]] \|\|x\|\|*`,
      `<em><kbd>a</kbd> ${SPOILER("x")}</em>`
    ]
  ];

  describe.each(cases)("%s", (_name, content, expected) => {
    it.each(engines)("%s", (_engine, render) => {
      expect(render(table(content))).toBe(cell(expected));
    });
  });
});

// Engine limit (Sätteri). The parser keeps one value per attribute, so when a span's block and the paragraph's own block on the next line both set an id, the parser has kept only the first and the paragraph's is gone before any plugin runs.
describe("span attributes, engine limit: an id on the span and another on the paragraph's own line", () => {
  const input = "--a--{#s}\n{#p}";

  it.each([
    ["markdown-it", mdit],
    ["remark", remd]
  ] as const)("%s keeps both", (_engine, render) => {
    expect(render(input)).toBe('<p id="p"><del id="s">a</del></p>');
  });

  it("sätteri keeps the span's", () => {
    expect(sat(input)).toBe('<p><del id="s">a</del></p>');
  });
});
