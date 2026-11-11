import { expect, it, describe } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { sup } from "../../packages/mdit-sup/src";
import { attrs } from "../../packages/mdit-attrs/src";
import { remarkSup } from "../../packages/remd-sup/src";
import { remarkAttrs } from "../../packages/remd-attrs/src";
import { normalizeHtml } from "../utils/index.js";

const md = new MarkdownIt().use(sup).use(attrs);

const remd = (src: string) =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkSup)
        .use(remarkAttrs)
        .use(remarkRehype)
        .use(rehypeStringify)
        .processSync(src)
    )
  );

const sat = (src: string) =>
  normalizeHtml(
    markdownToHtml(src, {
      features: {
        gfm: true,
        superscript: true,
        attributes: true,
        frontmatter: false,
        smartPunctuation: false
      }
    }).html
  );

// An engine limit: the markdown-it and remark attrs plugins put a block that follows a superscript on the `<sup>`, but Sätteri's built-in superscript node takes no attribute block, so at the end of a paragraph the block falls through to the paragraph. Pinned so that a change in Sätteri is noticed.
describe("sup + attrs: sup inline with class attr", () => {
  const input = "E=mc^2^{.physics}";
  const expected = '<p>E=mc<sup class="physics">2</sup></p>';

  it("markdown-it", () =>
    expect(normalizeHtml(md.render(input))).toBe(expected));
  it("remark", () => expect(remd(input)).toBe(expected));
  it("sätteri puts the class on the paragraph", () =>
    expect(sat(input)).toBe('<p class="physics">E=mc<sup>2</sup></p>'));
});

describe("sup + attrs: sup with heading attrs", () => {
  const input = "## References {.refs}\n\nSee note^1^.";
  const expected =
    '<h2 class="refs">References</h2><p>See note<sup>1</sup>.</p>';

  it("markdown-it", () =>
    expect(normalizeHtml(md.render(input))).toBe(expected));
  it("remark", () => expect(remd(input)).toBe(expected));
  it("sätteri", () => expect(sat(input)).toBe(expected));
});

describe("sup + attrs: sup and block attrs coexist", () => {
  const input = "Area is r^2^ × π. {.math}";
  const expected = '<p class="math">Area is r<sup>2</sup> × π.</p>';

  it("markdown-it", () =>
    expect(normalizeHtml(md.render(input))).toBe(expected));
  it("remark", () => expect(remd(input)).toBe(expected));
  it("sätteri", () => expect(sat(input)).toBe(expected));
});

// The same engine limit in the middle of a paragraph: Sätteri leaves the braces as text. Pinned so that a change in Sätteri is noticed.
describe("sup + attrs: an attribute block right after a superscript", () => {
  const input = "x^2^{.s} tail";
  const expected = '<p>x<sup class="s">2</sup> tail</p>';

  it("markdown-it", () =>
    expect(normalizeHtml(md.render(input))).toBe(expected));
  it("remark", () => expect(remd(input)).toBe(expected));
  it("sätteri leaves the block as text", () =>
    expect(sat(input)).toBe("<p>x<sup>2</sup>{.s} tail</p>"));
});
