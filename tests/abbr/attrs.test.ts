import { expect, it, describe } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { abbr } from "../../packages/mdit-abbr/src";
import { attrs } from "../../packages/mdit-attrs/src";
import { remarkAbbr } from "../../packages/remd-abbr/src";
import { remarkAttrs } from "../../packages/remd-attrs/src";
import { satteriAbbr } from "../../packages/sat-abbr/src";
import { normalizeHtml } from "../utils/index.js";

const md = new MarkdownIt().use(abbr).use(attrs);

const remd = (src: string) =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkAbbr)
        .use(remarkAttrs)
        .use(remarkRehype)
        .use(rehypeStringify)
        .processSync(src)
    )
  );

// Sätteri has attributes built in: its parser takes a block before any plugin runs.
const sat = (src: string) =>
  normalizeHtml(
    markdownToHtml(src, {
      features: {
        attributes: true,
        frontmatter: false,
        smartPunctuation: false
      },
      mdastPlugins: [satteriAbbr()]
    }).html
  );

describe("abbr + attrs: abbr with block attrs on paragraph", () => {
  const input =
    "*[HTML]: Hyper Text Markup Language\n\nThe HTML specification. {.intro}";
  const expected =
    '<p class="intro">The <abbr title="Hyper Text Markup Language">HTML</abbr> specification.</p>';

  it("markdown-it", () =>
    expect(normalizeHtml(md.render(input))).toBe(expected));
  it("remark", () => expect(remd(input)).toBe(expected));
  it("sätteri", () => expect(sat(input)).toBe(expected));
});

describe("abbr + attrs: abbr with heading attrs", () => {
  const input =
    "*[API]: Application Programming Interface\n\n## API Reference {#api-ref}";
  const expected =
    '<h2 id="api-ref"><abbr title="Application Programming Interface">API</abbr> Reference</h2>';

  it("markdown-it", () =>
    expect(normalizeHtml(md.render(input))).toBe(expected));
  it("remark", () => expect(remd(input)).toBe(expected));
  it("sätteri", () => expect(sat(input)).toBe(expected));
});

describe("abbr + attrs: abbr definition does not consume attrs block", () => {
  const input =
    "*[CSS]: Cascading Style Sheets\n\nUse CSS for styling.\n\n{.note}";
  // The standalone attrs block reaches the attrs plugin, which applies it to
  // its own paragraph, as markdown-it-attrs does.
  const expected =
    '<p>Use <abbr title="Cascading Style Sheets">CSS</abbr> for styling.</p><p class="note"></p>';

  it("markdown-it", () =>
    expect(normalizeHtml(md.render(input))).toBe(expected));
  it("remark", () => expect(remd(input)).toBe(expected));
  it("sätteri", () => expect(sat(input)).toBe(expected));
});

describe("abbr + attrs: abbr and softbreak attrs coexist", () => {
  const input = "*[JS]: JavaScript\n\nUse JS today.\n{.highlight}";
  const expected =
    '<p class="highlight">Use <abbr title="JavaScript">JS</abbr> today.</p>';

  it("markdown-it", () =>
    expect(normalizeHtml(md.render(input))).toBe(expected));
  it("remark", () => expect(remd(input)).toBe(expected));
  it("sätteri", () => expect(sat(input)).toBe(expected));
});

// A definition is its source line, so a block at the end of one is part of the title in every engine. Sätteri's parser has already taken it off the paragraph by the time the plugin runs, and the title is still what was written.
describe("abbr + attrs: an attribute block ending a definition is part of its title", () => {
  const input = "*[HTML]: Hyper Text {.x}\n\nThe HTML spec.";
  const expected = '<p>The <abbr title="Hyper Text {.x}">HTML</abbr> spec.</p>';

  it("markdown-it", () =>
    expect(normalizeHtml(md.render(input))).toBe(expected));
  it("remark", () => expect(remd(input)).toBe(expected));
  it("sätteri", () => expect(sat(input)).toBe(expected));
});
