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
