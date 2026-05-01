import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { sub } from "../../packages/mdit-sub/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cmCases = parseFixture(
  read("fixtures/sub-commonmark.md"),
  read("expected/sub-commonmark.html"),
);

const gfmCases = parseFixture(read("fixtures/sub-gfm.md"), read("expected/sub-gfm.html"));

const md = new MarkdownIt().use(sub);
const mdGfm = new MarkdownIt({ html: false, linkify: false, typographer: false })
  .enable("table")
  .use(sub);

test.each(cmCases)("sub (markdown-it): $name", ({ input, expected }) => {
  expect(normalizeHtml(md.render(input))).toBe(expected);
});

test.each(gfmCases)("sub (markdown-it) gfm: $name", ({ input, expected }) => {
  expect(normalizeHtml(mdGfm.render(input))).toBe(expected);
});
