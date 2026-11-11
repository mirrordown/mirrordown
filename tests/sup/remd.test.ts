import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { remarkSup } from "../../packages/remd-sup/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

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

const cmProcessor = unified()
  .use(remarkParse)
  .use(remarkSup)
  .use(remarkRehype)
  .use(rehypeStringify);

const gfmProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkSup)
  .use(remarkRehype)
  .use(rehypeStringify);

describe("sup/remd", () => {
  it.each(cmCases)("sup (remark): $name", ({ input, expected }) => {
    expect(normalizeHtml(String(cmProcessor.processSync(input)))).toBe(
      expected
    );
  });

  it.each(gfmCases)("sup (remark) gfm: $name", ({ input, expected }) => {
    expect(normalizeHtml(String(gfmProcessor.processSync(input)))).toBe(
      expected
    );
  });

  it.each(crossNodeCases)(
    "sup (remark) cross-node: $name",
    ({ input, expected }) => {
      expect(normalizeHtml(String(cmProcessor.processSync(input)))).toBe(
        expected
      );
    }
  );

  // markdown-it has no footnotes of its own, so these cases are shared with Sätteri only: a footnote reference is not a superscript delimiter, and superscripts sit beside and around one.
  it.each(footnoteCases)(
    "sup (remark) footnotes: $name",
    ({ input, expected }) => {
      expect(normalizeHtml(String(gfmProcessor.processSync(input)))).toBe(
        expected
      );
    }
  );

  // Crossing spans are malformed, and each engine resolves them its own way: here the construct that appeared first in the paragraph claims its pair, as in Sätteri, while markdown-it (see its test) pairs whichever closer comes first. Pinned so that a change in either is noticed.
  it.each([
    ["*x* ^a *b^ c*", "<p><em>x</em> ^a <em>b^ c</em></p>"],
    ["^x^ *a ^b* c^", "<p><sup>x</sup> *a <sup>b* c</sup></p>"]
  ])(
    "lets the construct seen first win when a superscript crosses emphasis: %s",
    (input, expected) => {
      expect(normalizeHtml(String(cmProcessor.processSync(input)))).toBe(
        expected
      );
    }
  );

  // A run of two or more carets is never a delimiter here or in markdown-it, even when a run of the same length follows. Sätteri's built-in superscript pairs such runs (see its test), which the plugins do not imitate. Pinned so that a change in either is noticed.
  it.each([
    ["^^a^^", "<p>^^a^^</p>"],
    ["x^^2^^ y", "<p>x^^2^^ y</p>"],
    ["^^^a^^^", "<p>^^^a^^^</p>"]
  ])("leaves caret runs of equal length as text: %s", (input, expected) => {
    expect(normalizeHtml(String(cmProcessor.processSync(input)))).toBe(
      expected
    );
  });
});
