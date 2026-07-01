import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { rehypeSlug } from "../../packages/remd-slug/src";
import { rehypeAutolinkHeadings } from "../../packages/remd-autolink-headings/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cmCases = parseFixture(
  read("fixtures/autolink-headings-commonmark.md"),
  read("expected/autolink-headings-commonmark.html")
);

const gfmCases = parseFixture(
  read("fixtures/autolink-headings-gfm.md"),
  read("expected/autolink-headings-gfm.html")
);

// rehypeSlug assigns ids, then rehypeAutolinkHeadings links to them; both run
// on the hast tree, after remarkRehype.
const cmProcessor = unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(rehypeSlug)
  .use(rehypeAutolinkHeadings)
  .use(rehypeStringify);

const gfmProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeSlug)
  .use(rehypeAutolinkHeadings)
  .use(rehypeStringify);

describe("autolink-headings/remd", () => {
  it.each(cmCases)("autolink (remark): $name", ({ input, expected }) => {
    expect(normalizeHtml(String(cmProcessor.processSync(input)))).toBe(
      expected
    );
  });

  it.each(gfmCases)("autolink (remark) gfm: $name", ({ input, expected }) => {
    expect(normalizeHtml(String(gfmProcessor.processSync(input)))).toBe(
      expected
    );
  });
});
