import { expect, it, describe } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { mark } from "../../packages/mdit-mark/src";
import { attrs } from "../../packages/mdit-attrs/src";
import { remarkMark } from "../../packages/remd-mark/src";
import { remarkAttrs } from "../../packages/remd-attrs/src";
import { satteriMark } from "../../packages/sat-mark/src";
import { normalizeHtml } from "../utils/index.js";
import {
  spanAttrsCases,
  spanAttrsOffCases,
  type SpanSyntax
} from "../core/span-attrs-cases.js";

const md = new MarkdownIt().use(mark).use(attrs);

const remd = (src: string) =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkMark)
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
      mdastPlugins: [satteriMark()]
    }).html
  );

describe("mark + attrs: mark inline with class attr", () => {
  const input = "==highlighted=={.highlight}";
  const expected = '<p><mark class="highlight">highlighted</mark></p>';

  it("markdown-it", () =>
    expect(normalizeHtml(md.render(input))).toBe(expected));
  it("remark", () => expect(remd(input)).toBe(expected));
  it("sätteri", () => expect(sat(input)).toBe(expected));
});

describe("mark + attrs: mark inline with id attr", () => {
  const input = "==important=={#key-point}";
  const expected = '<p><mark id="key-point">important</mark></p>';

  it("markdown-it", () =>
    expect(normalizeHtml(md.render(input))).toBe(expected));
  it("remark", () => expect(remd(input)).toBe(expected));
  it("sätteri", () => expect(sat(input)).toBe(expected));
});

describe("mark + attrs: mark with heading attrs", () => {
  const input = "## Key Terms {.terms}\n\n==highlighted== text.";
  const expected =
    '<h2 class="terms">Key Terms</h2><p><mark>highlighted</mark> text.</p>';

  it("markdown-it", () =>
    expect(normalizeHtml(md.render(input))).toBe(expected));
  it("remark", () => expect(remd(input)).toBe(expected));
  it("sätteri", () => expect(sat(input)).toBe(expected));
});

describe("mark + attrs: mark and block attrs coexist", () => {
  const input = "See ==important== note here. {.callout}";
  const expected =
    '<p class="callout">See <mark>important</mark> note here.</p>';

  it("markdown-it", () =>
    expect(normalizeHtml(md.render(input))).toBe(expected));
  it("remark", () => expect(remd(input)).toBe(expected));
  it("sätteri", () => expect(sat(input)).toBe(expected));
});

// A coloured highlight takes the attributes of a block written after it as well as its colour. The colour is set when the highlight is made, before any block is read, so it comes first in every engine; a `data-highlight` the author wrote in a block replaces it, since the author chose it.
describe.each([
  [
    "a class follows the colour",
    "==\u{1F534}text=={.note}",
    '<p><mark data-highlight="red" class="note">text</mark></p>'
  ],
  [
    "an id and a class follow the colour, in the middle of a paragraph",
    "a ==\u{1F7E2}text=={#key .note} b",
    '<p>a <mark data-highlight="green" id="key" class="note">text</mark> b</p>'
  ],
  [
    "a written data-highlight replaces the marker's colour",
    "==\u{1F534}text=={data-highlight=blue}",
    '<p><mark data-highlight="blue">text</mark></p>'
  ],
  [
    "a written data-highlight replaces the colour, in the middle of a paragraph",
    "==\u{1F534}text=={.note data-highlight=blue} b",
    '<p><mark data-highlight="blue" class="note">text</mark> b</p>'
  ],
  [
    "a written data-highlight on a plain highlight is kept",
    "==text=={data-highlight=green}",
    '<p><mark data-highlight="green">text</mark></p>'
  ],
  [
    "an emptied highlight still takes its block",
    "==\u{1F534}=={.note}",
    '<p><mark data-highlight="red" class="note"></mark></p>'
  ],
  [
    "a block inside a coloured highlight goes on the highlight it follows",
    "==\u{1F534}a ==\u{1F7E2}b=={.inner} c==",
    '<p><mark data-highlight="red">a <mark data-highlight="green" class="inner">b</mark> c</mark></p>'
  ]
])("mark + attrs, coloured: %s", (_name, input, expected) => {
  it("markdown-it", () =>
    expect(normalizeHtml(md.render(input))).toBe(expected));
  it("remark", () => expect(remd(input)).toBe(expected));
  it("sätteri", () => expect(sat(input)).toBe(expected));
});

const syntax: SpanSyntax = {
  span: "==x==",
  html: (attributes) => `<mark${attributes}>x</mark>`
};

// A block written right after the span: every engine gives it to the span, wherever the span is. Sätteri's parser has read the block before the plugin builds the span, so there the plugin takes it back (see `../core/span-attrs-cases.ts`).
describe.each(spanAttrsCases(syntax))(
  "mark + attrs: %s",
  (_name, input, expected) => {
    it("markdown-it", () =>
      expect(normalizeHtml(md.render(input))).toBe(expected));
    it("remark", () => expect(remd(input)).toBe(expected));
    it("sätteri", () => expect(sat(input)).toBe(expected));
  }
);

// With the document's attribute blocks off, Sätteri's parser leaves every block as text, and the plugin must not read one the document did not ask for.
describe.each(spanAttrsOffCases(syntax))(
  "mark, attribute blocks off: %s",
  (_name, input, expected) => {
    it("sätteri", () => expect(sat(input, false)).toBe(expected));
  }
);
