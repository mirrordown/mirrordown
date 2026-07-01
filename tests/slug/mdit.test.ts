import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { slug } from "../../packages/mdit-slug/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cmCases = parseFixture(
  read("fixtures/slug-commonmark.md"),
  read("expected/slug-commonmark.html")
);

const gfmCases = parseFixture(
  read("fixtures/slug-gfm.md"),
  read("expected/slug-gfm.html")
);

const md = new MarkdownIt().use(slug);

describe("slug/mdit", () => {
  it.each(cmCases)("slug (markdown-it): $name", ({ input, expected }) => {
    expect(normalizeHtml(md.render(input))).toBe(expected);
  });

  it.each(gfmCases)("slug (markdown-it) gfm: $name", ({ input, expected }) => {
    expect(normalizeHtml(md.render(input))).toBe(expected);
  });
});
