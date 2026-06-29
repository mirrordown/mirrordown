import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { rehypeLightbox } from "../../packages/remd-lightbox/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cmCases = parseFixture(
  read("fixtures/lightbox-commonmark.md"),
  read("expected/lightbox-commonmark.html")
);

const gfmCases = parseFixture(
  read("fixtures/lightbox-gfm.md"),
  read("expected/lightbox-gfm.html")
);

const cmProcessor = unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(rehypeLightbox)
  .use(rehypeStringify);

const gfmProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeLightbox)
  .use(rehypeStringify);

describe("lightbox/remd", () => {
  it.each(cmCases)("lightbox (rehype): $name", ({ input, expected }) => {
    expect(normalizeHtml(String(cmProcessor.processSync(input)))).toBe(
      expected
    );
  });

  it.each(gfmCases)("lightbox (rehype) gfm: $name", ({ input, expected }) => {
    expect(normalizeHtml(String(gfmProcessor.processSync(input)))).toBe(
      expected
    );
  });
});
