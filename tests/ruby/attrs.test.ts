import { expect, it, describe } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { ruby } from "../../packages/mdit-ruby/src";
import { attrs } from "../../packages/mdit-attrs/src";
import { remarkRuby } from "../../packages/remd-ruby/src";
import { remarkAttrs } from "../../packages/remd-attrs/src";
import { satteriRuby } from "../../packages/sat-ruby/src";
import { normalizeHtml } from "../utils/index.js";
import {
  escapedPipeCellCase,
  spanAttrsCases,
  spanAttrsOffCases,
  type SpanAttrsCase,
  type SpanSyntax
} from "../core/span-attrs-cases.js";

const md = new MarkdownIt().use(ruby).use(attrs);

const remd = (src: string) =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkRuby)
        .use(remarkAttrs)
        .use(remarkRehype)
        .use(rehypeStringify)
        .processSync(src)
    )
  );

// Sätteri reads attribute blocks itself, as a feature of the document, where the other two engines have an attrs plugin.
const sat = (src: string, attributes = true) =>
  normalizeHtml(
    markdownToHtml(src, {
      features: {
        gfm: true,
        frontmatter: false,
        smartPunctuation: false,
        attributes
      },
      mdastPlugins: [satteriRuby()]
    }).html
  );

describe("ruby + attrs: ruby with heading attrs", () => {
  const input = "## Kanji {.kanji}\n\n{漢字|かんじ}";
  const expected =
    '<h2 class="kanji">Kanji</h2><p><ruby>漢字<rt>かんじ</rt></ruby></p>';

  it("markdown-it", () =>
    expect(normalizeHtml(md.render(input))).toBe(expected));
  it("remark", () => expect(remd(input)).toBe(expected));
  it("sätteri", () => expect(sat(input)).toBe(expected));
});

describe("ruby + attrs: ruby and block attrs coexist", () => {
  const input = "Read {漢字|かんじ} carefully. {.note}";
  const expected =
    '<p class="note">Read <ruby>漢字<rt>かんじ</rt></ruby> carefully.</p>';

  it("markdown-it", () =>
    expect(normalizeHtml(md.render(input))).toBe(expected));
  it("remark", () => expect(remd(input)).toBe(expected));
  it("sätteri", () => expect(sat(input)).toBe(expected));
});

describe("ruby + attrs: ruby and attrs coexist without interference", () => {
  const input = "{日本|にほん}語\n\n{漢字|かんじ}";
  const expected =
    "<p><ruby>日本<rt>にほん</rt></ruby>語</p><p><ruby>漢字<rt>かんじ</rt></ruby></p>";

  it("markdown-it", () =>
    expect(normalizeHtml(md.render(input))).toBe(expected));
  it("remark", () => expect(remd(input)).toBe(expected));
  it("sätteri", () => expect(sat(input)).toBe(expected));
});

const syntax: SpanSyntax = {
  span: "{漢字|かんじ}",
  cellSpan: String.raw`{漢字\|かんじ}`,
  html: (attributes) => `<ruby${attributes}>漢字<rt>かんじ</rt></ruby>`
};

// A block written right after the span: every engine gives it to the span, wherever the span is. Sätteri's parser has read the block before the plugin builds the span, so there the plugin takes it back (see `../core/span-attrs-cases.ts`).
describe.each(spanAttrsCases(syntax))(
  "ruby + attrs: %s",
  (_name, input, expected) => {
    it("markdown-it", () =>
      expect(normalizeHtml(md.render(input))).toBe(expected));
    it("remark", () => expect(remd(input)).toBe(expected));
    it("sätteri", () => expect(sat(input)).toBe(expected));
  }
);

// With the document's attribute blocks off, Sätteri's parser leaves every block as text, and the plugin must not read one the document did not ask for.
describe.each(spanAttrsOffCases(syntax))(
  "ruby, attribute blocks off: %s",
  (_name, input, expected) => {
    it("sätteri", () => expect(sat(input, false)).toBe(expected));
  }
);

// Engine limit (Sätteri): the cell's own block is never read when the cell holds an escaped pipe, which a ruby in a table always does.
describe("ruby + attrs, engine limit: in a table cell, a block after a space is the cell's", () => {
  const { input, expected, satteri } = escapedPipeCellCase(syntax);

  it("markdown-it", () =>
    expect(normalizeHtml(md.render(input))).toBe(expected));
  it("remark", () => expect(remd(input)).toBe(expected));
  it("sätteri leaves the block as text", () =>
    expect(sat(input)).toBe(satteri));
});

// sat-ruby re-parses the text around a ruby on its own. Text that stops at an attribute block, because an inline element follows it, would end the re-parsed paragraph, and the parser would read the block off as that paragraph's: a block the document kept as text, or gave to the ruby, was lost.
describe("ruby + attrs: a block that ends the text before an inline element", () => {
  const cases: SpanAttrsCase[] = [
    [
      "is the ruby's when it touches the ruby",
      "{漢字|かんじ}{.r} *em*",
      '<p><ruby class="r">漢字<rt>かんじ</rt></ruby> <em>em</em></p>'
    ],
    [
      "stays text after a word, as a block in the middle of a paragraph is",
      "{漢字|かんじ} word{.r} *em*",
      "<p><ruby>漢字<rt>かんじ</rt></ruby> word{.r} <em>em</em></p>"
    ]
  ];

  describe.each(cases)("%s", (_name, input, expected) => {
    it("markdown-it", () =>
      expect(normalizeHtml(md.render(input))).toBe(expected));
    it("remark", () => expect(remd(input)).toBe(expected));
    it("sätteri", () => expect(sat(input)).toBe(expected));
  });
});
