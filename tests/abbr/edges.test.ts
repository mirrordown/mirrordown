import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { markdownToHtml } from "satteri";
import { parseAbbreviations } from "../../packages/core/src";
import { abbr } from "../../packages/mdit-abbr/src";
import { remarkAbbr } from "../../packages/remd-abbr/src";
import { satteriAbbr } from "../../packages/sat-abbr/src";
import { normalizeHtml } from "../utils/index.js";

const mdit = (input: string, env: object = {}): string =>
  normalizeHtml(new MarkdownIt().use(abbr).render(input, env));

const remd = (input: string): string =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(remarkAbbr)
        .use(remarkRehype)
        .use(rehypeStringify)
        .processSync(input)
    )
  );

const sat = (input: string): string =>
  normalizeHtml(
    markdownToHtml(input, {
      features: { gfm: false, frontmatter: false, smartPunctuation: false },
      mdastPlugins: [satteriAbbr()]
    }).html
  );

// markdown-it keeps its terms as keys of a plain object. A term that named a member every object inherits was never stored, which left a table with no terms, and a table with no terms builds a pattern that matches the empty string at one place forever: text starting with punctuation hung the render. These inputs show the same fault without hanging, as an empty `<abbr>` in the output.
describe("mdit-abbr: a term can't empty the table, and an empty table does nothing", () => {
  // `_proto__` itself can't appear as a word in running text (its underscores are emphasis), so the inherited names that can are used here.
  it.each([`constructor`, `toString`, `hasOwnProperty`])(
    "defines %s like any other term",
    (term) => {
      expect(mdit(`*[${term}]: x\n\nuse ${term} now`)).toBe(
        `<p>use <abbr title="x">${term}</abbr> now</p>`
      );
    }
  );

  it("leaves text alone when the only definition names an inherited member", () => {
    expect(mdit(`*[_proto__]: x\n\nplain  words here.`)).toBe(
      `<p>plain  words here.</p>`
    );
  });

  it("leaves text alone when the caller's env carries a table with no terms", () => {
    expect(mdit(`plain  words here.`, { abbreviations: {} })).toBe(
      `<p>plain  words here.</p>`
    );
  });
});

// Definitions are read a line at a time, and a document saved with Windows line endings is the same document.
describe("abbr definitions end at any line ending", () => {
  it("reads one definition per line whatever ends the line", () => {
    const expected = [
      [`A`, `one`],
      [`B`, `two`]
    ];
    expect(parseAbbreviations(`*[A]: one\n*[B]: two`)).toEqual(expected);
    expect(parseAbbreviations(`*[A]: one\r\n*[B]: two`)).toEqual(expected);
    expect(parseAbbreviations(`*[A]: one\r*[B]: two`)).toEqual(expected);
  });

  it.each([
    [`markdown-it`, mdit],
    [`remark`, remd],
    [`sätteri`, sat]
  ] as const)(
    "%s: two definitions on CRLF lines both apply",
    (_engine, render) => {
      expect(render(`*[A]: one\r\n*[B]: two\r\n\r\nA and B`)).toBe(
        `<p><abbr title="one">A</abbr> and <abbr title="two">B</abbr></p>`
      );
    }
  );
});
