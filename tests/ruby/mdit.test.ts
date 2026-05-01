import { readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { ruby } from "../../packages/mdit-ruby/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cmCases = parseFixture(
  read("fixtures/ruby-commonmark.md"),
  read("expected/ruby-commonmark.html"),
);

const gfmCases = parseFixture(read("fixtures/ruby-gfm.md"), read("expected/ruby-gfm.html"));

const mditCases = parseFixture(read("fixtures/ruby-mdit.md"), read("expected/ruby-mdit.html"));

const htmlCases = parseFixture(read("fixtures/ruby-html.md"), read("expected/ruby-html.html"));

// new MarkdownIt() enables tables by default
const md = new MarkdownIt().use(ruby);
// strikethrough is an opt-in built-in rule
const mdStrk = new MarkdownIt().enable("strikethrough").use(ruby);
const mdHtml = new MarkdownIt({ html: true }).use(ruby);

test.each(cmCases)("ruby (markdown-it): $name", ({ input, expected }) => {
  expect(normalizeHtml(md.render(input))).toBe(expected);
});

test.each(gfmCases)("ruby (markdown-it) gfm: $name", ({ input, expected }) => {
  expect(normalizeHtml(md.render(input))).toBe(expected);
});

test.each(mditCases)("ruby (markdown-it) strikethrough: $name", ({ input, expected }) => {
  expect(normalizeHtml(mdStrk.render(input))).toBe(expected);
});

test.each(htmlCases)("ruby (markdown-it) html: $name", ({ input, expected }) => {
  expect(normalizeHtml(mdHtml.render(input))).toBe(expected);
});
