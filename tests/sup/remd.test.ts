import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vite-plus/test";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { remarkSup } from "@saeris/remd-sup";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cmCases = parseFixture(
  read("fixtures/sup-commonmark.md"),
  read("expected/sup-commonmark.html"),
);

const gfmCases = parseFixture(read("fixtures/sup-gfm.md"), read("expected/sup-gfm.html"));

const cmProcessor = unified()
  .use(remarkParse)
  .use(remarkSup)
  .use(remarkRehype)
  .use(rehypeStringify);

const gfmProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkSup)
  .use(remarkRehype)
  .use(rehypeStringify);

test.each(cmCases)("sup (remark): $name", ({ input, expected }) => {
  expect(normalizeHtml(String(cmProcessor.processSync(input)))).toBe(expected);
});

test.each(gfmCases)("sup (remark) gfm: $name", ({ input, expected }) => {
  expect(normalizeHtml(String(gfmProcessor.processSync(input)))).toBe(expected);
});
