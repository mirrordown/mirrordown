import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { remarkKbd } from "../../packages/remd-kbd/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cmCases = parseFixture(
  read("fixtures/kbd-commonmark.md"),
  read("expected/kbd-commonmark.html")
);

const gfmCases = parseFixture(
  read("fixtures/kbd-gfm.md"),
  read("expected/kbd-gfm.html")
);

const cmProcessor = unified()
  .use(remarkParse)
  .use(remarkKbd)
  .use(remarkRehype)
  .use(rehypeStringify);

const gfmProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkKbd)
  .use(remarkRehype)
  .use(rehypeStringify);

describe("kbd/remd", () => {
  it.each(cmCases)("kbd (remark): $name", ({ input, expected }) => {
    expect(normalizeHtml(String(cmProcessor.processSync(input)))).toBe(
      expected
    );
  });

  it.each(gfmCases)("kbd (remark) gfm: $name", ({ input, expected }) => {
    expect(normalizeHtml(String(gfmProcessor.processSync(input)))).toBe(
      expected
    );
  });
});
