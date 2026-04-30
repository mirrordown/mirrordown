import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vite-plus/test";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { remarkMark } from "@saeris/remd-mark";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cmCases = parseFixture(
  read("fixtures/mark-commonmark.md"),
  read("expected/mark-commonmark.html"),
);

const gfmCases = parseFixture(read("fixtures/mark-gfm.md"), read("expected/mark-gfm.html"));

const cmProcessor = unified()
  .use(remarkParse)
  .use(remarkMark)
  .use(remarkRehype)
  .use(rehypeStringify);

const gfmProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMark)
  .use(remarkRehype)
  .use(rehypeStringify);

test.each(cmCases)("mark (remark): $name", ({ input, expected }) => {
  expect(normalizeHtml(String(cmProcessor.processSync(input)))).toBe(expected);
});

test.each(gfmCases)("mark (remark) gfm: $name", ({ input, expected }) => {
  expect(normalizeHtml(String(gfmProcessor.processSync(input)))).toBe(expected);
});
