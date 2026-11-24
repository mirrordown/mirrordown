import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { remarkTags } from "../../packages/remd-tags/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cmCases = parseFixture(
  read("fixtures/tags-commonmark.md"),
  read("expected/tags-commonmark.html")
);

const gfmCases = parseFixture(
  read("fixtures/tags-gfm.md"),
  read("expected/tags-gfm.html")
);

const cmProcessor = unified()
  .use(remarkParse)
  .use(remarkTags)
  .use(remarkRehype)
  .use(rehypeStringify);

const gfmProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkTags)
  .use(remarkRehype)
  .use(rehypeStringify);

describe("tags/remd", () => {
  it.each(cmCases)("tags (remark): $name", ({ input, expected }) => {
    expect(normalizeHtml(String(cmProcessor.processSync(input)))).toBe(
      expected
    );
  });

  it.each(gfmCases)("tags (remark) gfm: $name", ({ input, expected }) => {
    expect(normalizeHtml(String(gfmProcessor.processSync(input)))).toBe(
      expected
    );
  });
});
