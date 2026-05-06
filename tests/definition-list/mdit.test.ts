import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { dl } from "../../packages/mdit-definition-list/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cmCases = parseFixture(
  read("fixtures/definition-list-commonmark.md"),
  read("expected/definition-list-commonmark.html"),
);

const md = new MarkdownIt().use(dl);

test.each(cmCases)("definition-list (markdown-it): $name", ({ input, expected }) => {
  expect(normalizeHtml(md.render(input))).toBe(expected);
});
