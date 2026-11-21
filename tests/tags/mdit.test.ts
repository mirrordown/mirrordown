import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { tags } from "../../packages/mdit-tags/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cmCases = parseFixture(
  read("fixtures/tags-commonmark.md"),
  read("expected/tags-commonmark.html")
);

const gfmCases = parseFixture(
  read("fixtures/tags-gfm.md"),
  read("expected/tags-gfm.html")
);

const md = new MarkdownIt().use(tags);
// markdown-it has tables on by default; `linkify` stands in for GFM's bare URLs.
const mdGfm = new MarkdownIt({ linkify: true }).use(tags);

describe("tags/mdit", () => {
  it.each(cmCases)("tags (markdown-it): $name", ({ input, expected }) => {
    expect(normalizeHtml(md.render(input))).toBe(expected);
  });

  it.each(gfmCases)("tags (markdown-it) gfm: $name", ({ input, expected }) => {
    expect(normalizeHtml(mdGfm.render(input))).toBe(expected);
  });
});
