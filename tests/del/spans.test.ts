import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified, type Plugin } from "unified";
import type { Root } from "mdast";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { del } from "../../packages/mdit-del/src";
import { ins } from "../../packages/mdit-ins/src";
import { kbd } from "../../packages/mdit-kbd/src";
import { mark } from "../../packages/mdit-mark/src";
import { remarkDel } from "../../packages/remd-del/src";
import { remarkIns } from "../../packages/remd-ins/src";
import { remarkKbd } from "../../packages/remd-kbd/src";
import { remarkMark } from "../../packages/remd-mark/src";
import { satteriDel } from "../../packages/sat-del/src";
import { satteriIns } from "../../packages/sat-ins/src";
import { satteriKbd } from "../../packages/sat-kbd/src";
import { satteriMark } from "../../packages/sat-mark/src";
import { normalizeHtml } from "../utils/index.js";

// The span plugins run one after another in remark and Sätteri, each over the tree the previous one left. del runs first in the presets, so what it leaves behind decides whether the later plugins can still tell an escaped delimiter from a real one. markdown-it scans every marker in one pass and is the reference.

const md = new MarkdownIt().use(del).use(ins).use(kbd).use(mark);
const mdit = (input: string): string => normalizeHtml(md.render(input));

const remarkProcessor = unified()
  .use(remarkParse)
  .use(remarkDel)
  .use(remarkIns)
  .use(remarkKbd)
  .use(remarkMark)
  .use(remarkRehype)
  .use(rehypeStringify);
const remd = (input: string): string =>
  normalizeHtml(String(remarkProcessor.processSync(input)));

const sat = (input: string): string =>
  normalizeHtml(
    markdownToHtml(input, {
      features: { gfm: false, frontmatter: false, smartPunctuation: false },
      mdastPlugins: [satteriDel(), satteriIns(), satteriKbd(), satteriMark()]
    }).html
  );

const engines = [
  ["markdown-it", mdit],
  ["remark", remd],
  ["sätteri", sat]
] as const;

describe("del + other span plugins: an escape outlives the del scan", () => {
  const cases: [name: string, input: string, expected: string][] = [
    [
      "an escaped mark after a del span stays literal",
      String.raw`--a-- \==b==`,
      "<p><del>a</del> ==b==</p>"
    ],
    [
      "an escaped ins after a del span stays literal",
      String.raw`--x-- \++b++`,
      "<p><del>x</del> ++b++</p>"
    ],
    [
      "an escaped ins closer after a del span stays literal",
      String.raw`--x-- ++a\++`,
      "<p><del>x</del> ++a++</p>"
    ],
    [
      "an escaped ins inside a del span stays literal",
      String.raw`--a \++b++ c--`,
      "<p><del>a ++b++ c</del></p>"
    ],
    [
      "an escaped ins at the start of a del span stays literal",
      String.raw`--\++a++--`,
      "<p><del>++a++</del></p>"
    ],
    [
      "an escaped key after a del span stays literal",
      String.raw`--a-- \[[x]]`,
      "<p><del>a</del> [[x]]</p>"
    ],
    [
      "an escape survives two scans before the one it is for",
      String.raw`--a-- and ++b++ \==c==`,
      "<p><del>a</del> and <ins>b</ins> ==c==</p>"
    ],
    [
      "a character reference after a del span is still not a delimiter",
      "--a-- &#43;+b++",
      "<p><del>a</del> ++b++</p>"
    ]
  ];

  describe.each(engines)("%s", (_engine, render) => {
    it.each(cases)("%s", (_name, input, expected) => {
      expect(render(input)).toBe(expected);
    });
  });
});

describe("del registered twice: the second scan honours the first one's escapes", () => {
  const input = String.raw`--a --b-- c-- \--d--`;
  const expected = "<p><del>a <del>b</del> c</del> --d--</p>";

  it("remark", () => {
    // unified ignores a second `.use` of the same function, so the repeat is wrapped.
    const again: Plugin<[], Root> = function () {
      return remarkDel.call(this);
    };
    const processor = unified()
      .use(remarkParse)
      .use(remarkDel)
      .use(again)
      .use(remarkRehype)
      .use(rehypeStringify);
    expect(normalizeHtml(String(processor.processSync(input)))).toBe(expected);
  });

  it("sätteri", () => {
    expect(
      normalizeHtml(
        markdownToHtml(input, {
          features: { gfm: false, frontmatter: false, smartPunctuation: false },
          mdastPlugins: [satteriDel(), satteriDel()]
        }).html
      )
    ).toBe(expected);
  });
});

describe("private-use characters the author typed survive the scans", () => {
  // Escaped characters are swapped for Supplementary Private Use Area-A stand-ins while a scan runs. Those are real code points (Nerd Fonts puts icons there), so restoring the stand-ins must not rewrite the author's own to ASCII.
  const cases: [name: string, input: string, expected: string[]][] = [
    ["in a fenced code block", "```\n\u{F003C}\n```", ["\u{F003C}"]],
    [
      "in inline code beside a span",
      "`\u{F003C}` --a--",
      ["<code>\u{F003C}</code>", "<del>a</del>"]
    ],
    [
      "in the text a span is found in",
      "\u{F003C}b\u{F003E} --a--",
      ["<p>\u{F003C}b\u{F003E} <del>a</del></p>"]
    ],
    [
      "where they would decode to the marker itself",
      "\u{F002D}\u{F002D}a\u{F002D}\u{F002D} --b--",
      ["<p>\u{F002D}\u{F002D}a\u{F002D}\u{F002D} <del>b</del></p>"]
    ]
  ];

  describe.each(engines)("%s", (_engine, render) => {
    it.each(cases)("%s", (_name, input, expected) => {
      const html = render(input);
      for (const part of expected) expect(html).toContain(part);
    });
  });
});
