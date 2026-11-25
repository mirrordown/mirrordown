import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { remarkCjkBreaks } from "../../packages/remd-cjk-breaks/src";
import { comparable } from "../utils/hostile.js";
import { normalizeHtml, parseFixture } from "../utils/index.js";
import { withLineEndings } from "./line-endings.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cases = withLineEndings(
  parseFixture(
    read("fixtures/cjk-breaks-commonmark.md"),
    read("expected/cjk-breaks-commonmark.html")
  )
);

const processor = unified()
  .use(remarkParse)
  .use(remarkCjkBreaks)
  .use(remarkRehype)
  .use(rehypeStringify);

describe("cjk-breaks/remd", () => {
  it.each(cases)("cjk-breaks (remark): $name", ({ input, expected }) => {
    expect(
      normalizeHtml(comparable(String(processor.processSync(input))))
    ).toBe(expected);
  });
});
