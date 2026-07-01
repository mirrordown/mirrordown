import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { slug } from "../../packages/mdit-slug/src";
import { autolinkHeadings } from "../../packages/mdit-autolink-headings/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cmCases = parseFixture(
  read("fixtures/autolink-headings-commonmark.md"),
  read("expected/autolink-headings-commonmark.html")
);

const gfmCases = parseFixture(
  read("fixtures/autolink-headings-gfm.md"),
  read("expected/autolink-headings-gfm.html")
);

// The realistic pairing: slug assigns ids, then autolink links to them.
const md = new MarkdownIt().use(slug).use(autolinkHeadings);

describe("autolink-headings/mdit", () => {
  it.each(cmCases)("autolink (markdown-it): $name", ({ input, expected }) => {
    expect(normalizeHtml(md.render(input))).toBe(expected);
  });

  it.each(gfmCases)(
    "autolink (markdown-it) gfm: $name",
    ({ input, expected }) => {
      expect(normalizeHtml(md.render(input))).toBe(expected);
    }
  );
});
