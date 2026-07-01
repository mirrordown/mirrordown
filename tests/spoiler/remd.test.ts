import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import {
  remarkSpoiler,
  spoilerHastHandlers
} from "../../packages/remd-spoiler/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cmCases = parseFixture(
  read("fixtures/spoiler-commonmark.md"),
  read("expected/spoiler-commonmark.html")
);

const gfmCases = parseFixture(
  read("fixtures/spoiler-gfm.md"),
  read("expected/spoiler-gfm.html")
);

const cmProcessor = unified()
  .use(remarkParse)
  .use(remarkSpoiler)
  .use(remarkRehype, { handlers: spoilerHastHandlers })
  .use(rehypeStringify);

const gfmProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkSpoiler)
  .use(remarkRehype, { handlers: spoilerHastHandlers })
  .use(rehypeStringify);

describe("spoiler/remd", () => {
  it.each(cmCases)("spoiler (remark): $name", ({ input, expected }) => {
    expect(normalizeHtml(String(cmProcessor.processSync(input)))).toBe(
      expected
    );
  });

  it.each(gfmCases)("spoiler (remark) gfm: $name", ({ input, expected }) => {
    expect(normalizeHtml(String(gfmProcessor.processSync(input)))).toBe(
      expected
    );
  });
});
