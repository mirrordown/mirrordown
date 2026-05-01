import { readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { abbr } from "../../packages/mdit-abbr/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cmCases = parseFixture(
  read("fixtures/abbr-commonmark.md"),
  read("expected/abbr-commonmark.html"),
);

const gfmCases = parseFixture(read("fixtures/abbr-gfm.md"), read("expected/abbr-gfm.html"));

const md = new MarkdownIt({ linkify: true }).use(abbr);
const mdGfm = new MarkdownIt({ html: false, linkify: false, typographer: false })
  .enable("table")
  .use(abbr);

test.each(cmCases)("abbr (markdown-it): $name", ({ input, expected }) => {
  expect(normalizeHtml(md.render(input))).toBe(expected);
});

test.each(gfmCases)("abbr (markdown-it) gfm: $name", ({ input, expected }) => {
  expect(normalizeHtml(mdGfm.render(input))).toBe(expected);
});
