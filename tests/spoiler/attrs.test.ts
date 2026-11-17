import { expect, it, describe } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { spoiler } from "../../packages/mdit-spoiler/src";
import { attrs } from "../../packages/mdit-attrs/src";
import {
  remarkSpoiler,
  spoilerHastHandlers
} from "../../packages/remd-spoiler/src";
import { remarkAttrs } from "../../packages/remd-attrs/src";
import { satteriSpoiler } from "../../packages/sat-spoiler/src";
import { normalizeHtml } from "../utils/index.js";
import {
  escapedPipeCellCase,
  spanAttrsCases,
  spanAttrsOffCases,
  type SpanSyntax
} from "../core/span-attrs-cases.js";

const md = new MarkdownIt().use(spoiler).use(attrs);

const remd = (src: string) =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkSpoiler)
        .use(remarkAttrs)
        .use(remarkRehype, { handlers: spoilerHastHandlers })
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
      mdastPlugins: [satteriSpoiler()]
    }).html
  );

const SPOILER = (inner: string) =>
  `<label class="markdown-spoiler">` +
  `<input type="checkbox" class="markdown-spoiler-toggle" aria-label="spoiler">` +
  `<span class="markdown-spoiler-content">${inner}</span></label>`;

// Block-level attrs on the surrounding paragraph coexist with a spoiler and
// land on the <p> in both engines.
describe("spoiler + attrs: block attrs coexist with a spoiler", () => {
  const input = "See ||spoiler|| here. {.callout}";
  const expected = `<p class="callout">See ${SPOILER("spoiler")} here.</p>`;

  it("markdown-it", () =>
    expect(normalizeHtml(md.render(input))).toBe(expected));
  it("remark", () => expect(remd(input)).toBe(expected));
  it("sätteri", () => expect(sat(input)).toBe(expected));
});

// Inline attrs written directly after a spoiler do NOT attach to it in either
// engine (unlike `mark`, whose close token attrs recognizes). Both engines drop
// the trailing `{...}` onto the spoiler as a no-op, so parity is preserved. This
// encodes the invariant that the two engines agree here, not that attachment is
// desired.
describe("spoiler + attrs: inline attrs after a spoiler are a no-op", () => {
  const input = "||secret||{.danger}";
  const expected = `<p>${SPOILER("secret")}</p>`;

  it("markdown-it", () =>
    expect(normalizeHtml(md.render(input))).toBe(expected));
  it("remark", () => expect(remd(input)).toBe(expected));
  it("sätteri", () => expect(sat(input)).toBe(expected));
});

// A spoiler in a heading that carries heading attrs: the attrs land on the
// heading and the spoiler renders normally, identically in both engines. The
// spoiler is followed by trailing text so the `{...}` attaches to the heading
// (attrs won't attach when the spoiler is the heading's final token).
describe("spoiler + attrs: spoiler in a heading with heading attrs", () => {
  const input = "## The ||twist|| ending {.chapter}";
  const expected = `<h2 class="chapter">The ${SPOILER("twist")} ending</h2>`;

  it("markdown-it", () =>
    expect(normalizeHtml(md.render(input))).toBe(expected));
  it("remark", () => expect(remd(input)).toBe(expected));
  it("sätteri", () => expect(sat(input)).toBe(expected));
});

// Whatever is written after it, a spoiler renders the same: see "inline attrs after a spoiler are a no-op" above.
const syntax: SpanSyntax = {
  span: "||x||",
  cellSpan: String.raw`\|\|x\|\|`,
  html: () => SPOILER("x")
};

// A block written right after the span: every engine gives it to the span, wherever the span is. Sätteri's parser has read the block before the plugin builds the span, so there the plugin takes it back (see `../core/span-attrs-cases.ts`).
describe.each(spanAttrsCases(syntax))(
  "spoiler + attrs: %s",
  (_name, input, expected) => {
    it("markdown-it", () =>
      expect(normalizeHtml(md.render(input))).toBe(expected));
    it("remark", () => expect(remd(input)).toBe(expected));
    it("sätteri", () => expect(sat(input)).toBe(expected));
  }
);

// With the document's attribute blocks off, Sätteri's parser leaves every block as text, and the plugin must not read one the document did not ask for.
describe.each(spanAttrsOffCases(syntax))(
  "spoiler, attribute blocks off: %s",
  (_name, input, expected) => {
    it("sätteri", () => expect(sat(input, false)).toBe(expected));
  }
);

// Engine limit (Sätteri): the cell's own block is never read when the cell holds an escaped pipe, which a spoiler in a table always does.
describe("spoiler + attrs, engine limit: in a table cell, a block after a space is the cell's", () => {
  const { input, expected, satteri } = escapedPipeCellCase(syntax);

  it("markdown-it", () =>
    expect(normalizeHtml(md.render(input))).toBe(expected));
  it("remark", () => expect(remd(input)).toBe(expected));
  it("sätteri leaves the block as text", () =>
    expect(sat(input)).toBe(satteri));
});
