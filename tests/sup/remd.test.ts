import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { remarkSup } from "../../packages/remd-sup/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cmCases = parseFixture(
  read("fixtures/sup-commonmark.md"),
  read("expected/sup-commonmark.html")
);

const gfmCases = parseFixture(
  read("fixtures/sup-gfm.md"),
  read("expected/sup-gfm.html")
);

const crossNodeCases = parseFixture(
  read("fixtures/sup-cross-node.md"),
  read("expected/sup-cross-node.html")
);

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

describe("sup/remd", () => {
  it.each(cmCases)("sup (remark): $name", ({ input, expected }) => {
    expect(normalizeHtml(String(cmProcessor.processSync(input)))).toBe(
      expected
    );
  });

  it.each(gfmCases)("sup (remark) gfm: $name", ({ input, expected }) => {
    expect(normalizeHtml(String(gfmProcessor.processSync(input)))).toBe(
      expected
    );
  });

  it.each(crossNodeCases)(
    "sup (remark) cross-node: $name",
    ({ input, expected }) => {
      expect(normalizeHtml(String(cmProcessor.processSync(input)))).toBe(
        expected
      );
    }
  );
});
