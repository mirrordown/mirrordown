import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { sup } from "@saeris/mdit-sup";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cmCases = parseFixture(
  read("fixtures/sup-commonmark.md"),
  read("expected/sup-commonmark.html"),
);

const gfmCases = parseFixture(read("fixtures/sup-gfm.md"), read("expected/sup-gfm.html"));

const md = new MarkdownIt().use(sup);
const mdGfm = new MarkdownIt({ html: false, linkify: false, typographer: false })
  .enable("table")
  .use(sup);

test.each(cmCases)("sup (markdown-it): $name", ({ input, expected }) => {
  expect(normalizeHtml(md.render(input))).toBe(expected);
});

test.each(gfmCases)("sup (markdown-it) gfm: $name", ({ input, expected }) => {
  expect(normalizeHtml(mdGfm.render(input))).toBe(expected);
});
