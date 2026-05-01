import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { kbd } from "../../packages/mdit-kbd/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cmCases = parseFixture(
  read("fixtures/kbd-commonmark.md"),
  read("expected/kbd-commonmark.html"),
);

const gfmCases = parseFixture(read("fixtures/kbd-gfm.md"), read("expected/kbd-gfm.html"));

const md = new MarkdownIt().use(kbd);

test.each(cmCases)("kbd (markdown-it): $name", ({ input, expected }) => {
  expect(normalizeHtml(md.render(input))).toBe(expected);
});

test.each(gfmCases)("kbd (markdown-it) gfm: $name", ({ input, expected }) => {
  expect(normalizeHtml(md.render(input))).toBe(expected);
});
