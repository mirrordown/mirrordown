import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { mark } from "@saeris/mdit-mark";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cmCases = parseFixture(
  read("fixtures/mark-commonmark.md"),
  read("expected/mark-commonmark.html"),
);

const gfmCases = parseFixture(read("fixtures/mark-gfm.md"), read("expected/mark-gfm.html"));

const md = new MarkdownIt().use(mark);

test.each(cmCases)("mark (markdown-it): $name", ({ input, expected }) => {
  expect(normalizeHtml(md.render(input))).toBe(expected);
});

test.each(gfmCases)("mark (markdown-it) gfm: $name", ({ input, expected }) => {
  expect(normalizeHtml(md.render(input))).toBe(expected);
});
