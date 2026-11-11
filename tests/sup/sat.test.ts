import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { markdownToHtml } from "satteri";
import { normalizeHtml, parseFixture } from "../utils/index.js";

// Sätteri parses `^sup^` natively, so there is no sat-sup package: these fixtures check that its `superscript` feature renders what the markdown-it and remark plugins do.

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cmCases = parseFixture(
  read("fixtures/sup-commonmark.md"),
  read("expected/sup-commonmark.html")
);

const gfmCases = parseFixture(
  read("fixtures/sup-gfm.md"),
  read("expected/sup-gfm.html")
);

const crossNodeCases = parseFixture(
  read("fixtures/sup-cross-node.md"),
  read("expected/sup-cross-node.html")
);

const footnoteCases = parseFixture(
  read("fixtures/sup-footnotes.md"),
  read("expected/sup-footnotes.html")
);

const render = (input: string, gfm: boolean): string =>
  normalizeHtml(
    markdownToHtml(input, {
      features: {
        gfm,
        superscript: true,
        frontmatter: false,
        smartPunctuation: false
      }
    }).html
  );

describe("sup/sat", () => {
  it.each(cmCases)("sup (sätteri): $name", ({ input, expected }) => {
    expect(render(input, false)).toBe(expected);
  });

  it.each(gfmCases)("sup (sätteri) gfm: $name", ({ input, expected }) => {
    expect(render(input, true)).toBe(expected);
  });

  it.each(crossNodeCases)(
    "sup (sätteri) cross-node: $name",
    ({ input, expected }) => {
      expect(render(input, false)).toBe(expected);
    }
  );

  // markdown-it has no footnotes of its own, so these cases are shared with remark only: a footnote reference is not a superscript delimiter, and superscripts sit beside and around one.
  it.each(footnoteCases)(
    "sup (sätteri) footnotes: $name",
    ({ input, expected }) => {
      expect(render(input, true)).toBe(expected);
    }
  );

  // Crossing spans are malformed, and each engine resolves them its own way: here the construct that appeared first in the paragraph claims its pair, as in remark, while markdown-it (see its test) pairs whichever closer comes first. Pinned so that a change in either is noticed.
  it.each([
    ["*x* ^a *b^ c*", "<p><em>x</em> ^a <em>b^ c</em></p>"],
    ["^x^ *a ^b* c^", "<p><sup>x</sup> *a <sup>b* c</sup></p>"]
  ])(
    "lets the construct seen first win when a superscript crosses emphasis: %s",
    (input, expected) => {
      expect(render(input, false)).toBe(expected);
    }
  );

  // An engine limit: markdown-it and remark read a run of two or more carets as plain text and render `<p>^^a^^</p>`, but Sätteri pairs two runs of the same length. Pinned so that a change in Sätteri is noticed.
  it.each([
    ["^^a^^", "<p><sup>a</sup></p>"],
    ["x^^2^^ y", "<p>x<sup>2</sup> y</p>"],
    ["^^^a^^^", "<p><sup><sup>a</sup></sup></p>"]
  ])("pairs caret runs of equal length: %s", (input, expected) => {
    expect(render(input, false)).toBe(expected);
  });
});
