import { expect, it, describe } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { ins } from "../../packages/mdit-ins/src";
import { attrs } from "../../packages/mdit-attrs/src";
import { remarkIns } from "../../packages/remd-ins/src";
import { remarkAttrs } from "../../packages/remd-attrs/src";
import { satteriIns } from "../../packages/sat-ins/src";
import { normalizeHtml } from "../utils/index.js";
import {
  spanAttrsCases,
  spanAttrsOffCases,
  type SpanSyntax
} from "../core/span-attrs-cases.js";

const md = new MarkdownIt().use(ins).use(attrs);

const remd = (src: string) =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkIns)
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
      mdastPlugins: [satteriIns()]
    }).html
  );

describe("ins + attrs: ins inline with class attr", () => {
  const input = "++inserted++{.new}";
  const expected = '<p><ins class="new">inserted</ins></p>';

  it("markdown-it", () =>
    expect(normalizeHtml(md.render(input))).toBe(expected));
  it("remark", () => expect(remd(input)).toBe(expected));
  it("sätteri", () => expect(sat(input)).toBe(expected));
});

describe("ins + attrs: ins inline with id attr", () => {
  const input = "++added++{#ins-1}";
  const expected = '<p><ins id="ins-1">added</ins></p>';

  it("markdown-it", () =>
    expect(normalizeHtml(md.render(input))).toBe(expected));
  it("remark", () => expect(remd(input)).toBe(expected));
  it("sätteri", () => expect(sat(input)).toBe(expected));
});

describe("ins + attrs: ins with heading attrs", () => {
  const input = "## New Section {.new}\n\n++inserted content++";
  const expected =
    '<h2 class="new">New Section</h2><p><ins>inserted content</ins></p>';

  it("markdown-it", () =>
    expect(normalizeHtml(md.render(input))).toBe(expected));
  it("remark", () => expect(remd(input)).toBe(expected));
  it("sätteri", () => expect(sat(input)).toBe(expected));
});

describe("ins + attrs: ins and block attrs coexist", () => {
  const input = "Some ++inserted++ text here. {.updated}";
  const expected = '<p class="updated">Some <ins>inserted</ins> text here.</p>';

  it("markdown-it", () =>
    expect(normalizeHtml(md.render(input))).toBe(expected));
  it("remark", () => expect(remd(input)).toBe(expected));
  it("sätteri", () => expect(sat(input)).toBe(expected));
});

const syntax: SpanSyntax = {
  span: "++x++",
  html: (attributes) => `<ins${attributes}>x</ins>`
};

// A block written right after the span: every engine gives it to the span, wherever the span is. Sätteri's parser has read the block before the plugin builds the span, so there the plugin takes it back (see `../core/span-attrs-cases.ts`).
describe.each(spanAttrsCases(syntax))(
  "ins + attrs: %s",
  (_name, input, expected) => {
    it("markdown-it", () =>
      expect(normalizeHtml(md.render(input))).toBe(expected));
    it("remark", () => expect(remd(input)).toBe(expected));
    it("sätteri", () => expect(sat(input)).toBe(expected));
  }
);

// With the document's attribute blocks off, Sätteri's parser leaves every block as text, and the plugin must not read one the document did not ask for.
describe.each(spanAttrsOffCases(syntax))(
  "ins, attribute blocks off: %s",
  (_name, input, expected) => {
    it("sätteri", () => expect(sat(input, false)).toBe(expected));
  }
);
