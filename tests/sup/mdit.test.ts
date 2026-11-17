import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { sup } from "../../packages/mdit-sup/src";
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

const md = new MarkdownIt().use(sup);
const mdGfm = new MarkdownIt({
  html: false,
  linkify: false,
  typographer: false
})
  .enable("table")
  .use(sup);

describe("sup/mdit", () => {
  it.each(cmCases)("sup (markdown-it): $name", ({ input, expected }) => {
    expect(normalizeHtml(md.render(input))).toBe(expected);
  });

  it.each(gfmCases)("sup (markdown-it) gfm: $name", ({ input, expected }) => {
    expect(normalizeHtml(mdGfm.render(input))).toBe(expected);
  });

  it.each(crossNodeCases)(
    "sup (markdown-it) cross-node: $name",
    ({ input, expected }) => {
      expect(normalizeHtml(md.render(input))).toBe(expected);
    }
  );

  // Crossing spans are malformed, and each engine resolves them its own way: markdown-it pairs whichever closer comes first, while remark and Sätteri (see their tests) let the construct that appeared first in the paragraph win. Pinned so that a change in either is noticed.
  it.each([
    ["*x* ^a *b^ c*", "<p><em>x</em> <sup>a *b</sup> c*</p>"],
    ["^x^ *a ^b* c^", "<p><sup>x</sup> <em>a ^b</em> c^</p>"]
  ])(
    "closes the first closer when a superscript crosses emphasis: %s",
    (input, expected) => {
      expect(normalizeHtml(md.render(input))).toBe(expected);
    }
  );

  // A run of two or more carets is never a delimiter here or in remark, even when a run of the same length follows. Sätteri's built-in superscript pairs such runs (see its test), which the plugins do not imitate. Pinned so that a change in either is noticed.
  it.each([
    ["^^a^^", "<p>^^a^^</p>"],
    ["x^^2^^ y", "<p>x^^2^^ y</p>"],
    ["^^^a^^^", "<p>^^^a^^^</p>"]
  ])("leaves caret runs of equal length as text: %s", (input, expected) => {
    expect(normalizeHtml(md.render(input))).toBe(expected);
  });
});
