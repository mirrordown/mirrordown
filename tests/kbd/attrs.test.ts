import { expect, it, describe } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { kbd } from "../../packages/mdit-kbd/src";
import { attrs } from "../../packages/mdit-attrs/src";
import { remarkKbd } from "../../packages/remd-kbd/src";
import { remarkAttrs } from "../../packages/remd-attrs/src";
import { satteriKbd } from "../../packages/sat-kbd/src";
import { normalizeHtml } from "../utils/index.js";
import {
  spanAttrsCases,
  spanAttrsOffCases,
  type SpanSyntax
} from "../core/span-attrs-cases.js";

const md = new MarkdownIt().use(kbd).use(attrs);

const remd = (src: string) =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkKbd)
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
      mdastPlugins: [satteriKbd()]
    }).html
  );

describe("kbd + attrs: kbd inline with class attr", () => {
  const input = "[[Ctrl]]{.key}";
  const expected = '<p><kbd class="key">Ctrl</kbd></p>';

  it("markdown-it", () =>
    expect(normalizeHtml(md.render(input))).toBe(expected));
  it("remark", () => expect(remd(input)).toBe(expected));
  it("sätteri", () => expect(sat(input)).toBe(expected));
});

describe("kbd + attrs: kbd inline with id attr", () => {
  const input = "[[Enter]]{#enter-key}";
  const expected = '<p><kbd id="enter-key">Enter</kbd></p>';

  it("markdown-it", () =>
    expect(normalizeHtml(md.render(input))).toBe(expected));
  it("remark", () => expect(remd(input)).toBe(expected));
  it("sätteri", () => expect(sat(input)).toBe(expected));
});

describe("kbd + attrs: kbd with heading attrs", () => {
  const input = "## Shortcuts {.shortcuts}\n\nPress [[Ctrl]].";
  const expected =
    '<h2 class="shortcuts">Shortcuts</h2><p>Press <kbd>Ctrl</kbd>.</p>';

  it("markdown-it", () =>
    expect(normalizeHtml(md.render(input))).toBe(expected));
  it("remark", () => expect(remd(input)).toBe(expected));
  it("sätteri", () => expect(sat(input)).toBe(expected));
});

describe("kbd + attrs: kbd and block attrs coexist", () => {
  const input = "Press [[Ctrl]] to copy text. {.tip}";
  const expected = '<p class="tip">Press <kbd>Ctrl</kbd> to copy text.</p>';

  it("markdown-it", () =>
    expect(normalizeHtml(md.render(input))).toBe(expected));
  it("remark", () => expect(remd(input)).toBe(expected));
  it("sätteri", () => expect(sat(input)).toBe(expected));
});

const syntax: SpanSyntax = {
  span: "[[Ctrl]]",
  html: (attributes) => `<kbd${attributes}>Ctrl</kbd>`
};

// A block written right after the span: every engine gives it to the span, wherever the span is. Sätteri's parser has read the block before the plugin builds the span, so there the plugin takes it back (see `../core/span-attrs-cases.ts`).
describe.each(spanAttrsCases(syntax))(
  "kbd + attrs: %s",
  (_name, input, expected) => {
    it("markdown-it", () =>
      expect(normalizeHtml(md.render(input))).toBe(expected));
    it("remark", () => expect(remd(input)).toBe(expected));
    it("sätteri", () => expect(sat(input)).toBe(expected));
  }
);

// With the document's attribute blocks off, Sätteri's parser leaves every block as text, and the plugin must not read one the document did not ask for.
describe.each(spanAttrsOffCases(syntax))(
  "kbd, attribute blocks off: %s",
  (_name, input, expected) => {
    it("sätteri", () => expect(sat(input, false)).toBe(expected));
  }
);
