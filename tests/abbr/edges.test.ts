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

const engines = [
  [`markdown-it`, mdit],
  [`remark`, remd],
  [`sätteri`, sat]
] as const;

// Where a term may stand is markdown-it-abbr's rule, which the markdown-it plugin keeps: between the edges of the text, punctuation, spaces and a few ASCII symbols. remark and Sätteri once used `\b`, which never matched a term edged with a symbol or a non-ASCII letter and took any non-ASCII letter for a boundary. The shared fixture holds the everyday cases; these are the ones a looser rule gets wrong.
describe("abbr: a term stands between the same boundaries in every engine", () => {
  const cases: [name: string, input: string, expected: string][] = [
    [
      `a tab is not a boundary`,
      `*[HTML]: Hyper\n\nHTML\tfoo and\tHTML`,
      `<p>HTML\tfoo and\tHTML</p>`
    ],
    [
      `a term can't start where the last one ended, even if that one ends with a boundary character`,
      `*[a+]: one\n*[+]: two\n\na++ and + here`,
      `<p><abbr title="one">a+</abbr>+ and <abbr title="two">+</abbr> here</p>`
    ],
    [
      `a shorter term matches where the longer one runs into a word`,
      `*[HT]: one\n*[HTML]: two\n\nHT HTML HT-ML HTMLx`,
      `<p><abbr title="one">HT</abbr> <abbr title="two">HTML</abbr> <abbr title="one">HT</abbr>-ML HTMLx</p>`
    ],
    [
      `a character outside the BMP is one character, in a term and next to one`,
      `*[𝔸]: double-struck\n\n𝔸 x𝔸 𝔸𝔸 (𝔸)`,
      `<p><abbr title="double-struck">𝔸</abbr> x𝔸 𝔸𝔸 (<abbr title="double-struck">𝔸</abbr>)</p>`
    ]
  ];

  describe.each(engines)("%s", (_engine, render) => {
    it.each(cases)("%s", (_name, input, expected) => {
      expect(render(input)).toBe(expected);
    });
  });
});

// markdown-it holds an escaped character or a character reference in a token of its own until `text_join`. The abbreviation rule reads such a run as one text (the shared fixture has those cases) but stays ahead of the typographer, so a term is found as it was written, and what was escaped is still escaped when the typographer runs.
describe("mdit-abbr: abbreviations are found before the typographer runs", () => {
  const typographer = (input: string): string =>
    normalizeHtml(
      new MarkdownIt({ typographer: true }).use(abbr).render(input)
    );

  it("finds a term holding characters the typographer rewrites", () => {
    expect(typographer(`*[rock'n'roll]: music\n\nrock'n'roll here`)).toBe(
      `<p><abbr title="music">rock’n’roll</abbr> here</p>`
    );
  });

  it("leaves an escaped quote next to a term straight, and curls a plain one", () => {
    expect(typographer(`*[HTML]: Hyper\n\n\\"HTML\\" and "HTML"`)).toBe(
      `<p>"<abbr title="Hyper">HTML</abbr>" and “<abbr title="Hyper">HTML</abbr>”</p>`
    );
  });

  it("leaves an escaped character inside a term to the typographer as escaped", () => {
    expect(typographer(`*[a"b]: t\n\nsee a\\"b now`)).toBe(
      `<p>see <abbr title="t">a"b</abbr> now</p>`
    );
  });
});
