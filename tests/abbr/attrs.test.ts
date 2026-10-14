import { expect, it, describe } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { abbr } from "../../packages/mdit-abbr/src";
import { attrs } from "../../packages/mdit-attrs/src";
import { remarkAbbr } from "../../packages/remd-abbr/src";
import { remarkAttrs } from "../../packages/remd-attrs/src";
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

describe("abbr + attrs: abbr with block attrs on paragraph", () => {
  const input =
    "*[HTML]: Hyper Text Markup Language\n\nThe HTML specification. {.intro}";
  const expected =
    '<p class="intro">The <abbr title="Hyper Text Markup Language">HTML</abbr> specification.</p>';

  it("markdown-it", () =>
    expect(normalizeHtml(md.render(input))).toBe(expected));
  it("remark", () => expect(remd(input)).toBe(expected));
});

describe("abbr + attrs: abbr with heading attrs", () => {
  const input =
    "*[API]: Application Programming Interface\n\n## API Reference {#api-ref}";
  const expected =
    '<h2 id="api-ref"><abbr title="Application Programming Interface">API</abbr> Reference</h2>';

  it("markdown-it", () =>
    expect(normalizeHtml(md.render(input))).toBe(expected));
  it("remark", () => expect(remd(input)).toBe(expected));
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
});

describe("abbr + attrs: abbr and softbreak attrs coexist", () => {
  const input = "*[JS]: JavaScript\n\nUse JS today.\n{.highlight}";
  const expected =
    '<p class="highlight">Use <abbr title="JavaScript">JS</abbr> today.</p>';

  it("markdown-it", () =>
    expect(normalizeHtml(md.render(input))).toBe(expected));
  it("remark", () => expect(remd(input)).toBe(expected));
});
