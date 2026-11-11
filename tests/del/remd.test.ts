import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { remarkDel } from "../../packages/remd-del/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cmCases = parseFixture(
  read("fixtures/del-commonmark.md"),
  read("expected/del-commonmark.html")
);

const gfmCases = parseFixture(
  read("fixtures/del-gfm.md"),
  read("expected/del-gfm.html")
);

const cmProcessor = unified()
  .use(remarkParse)
  .use(remarkDel)
  .use(remarkRehype)
  .use(rehypeStringify);

const gfmProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkDel)
  .use(remarkRehype)
  .use(rehypeStringify);

describe("del/remd", () => {
  it.each(cmCases)("del (remark): $name", ({ input, expected }) => {
    expect(normalizeHtml(String(cmProcessor.processSync(input)))).toBe(
      expected
    );
  });

  it.each(gfmCases)("del (remark) gfm: $name", ({ input, expected }) => {
    expect(normalizeHtml(String(gfmProcessor.processSync(input)))).toBe(
      expected
    );
  });

  it("needs the file to honour an escape: a bare tree has no source to tell `\\--` from `--`", () => {
    // The parser resolves escapes, so the plugin recovers them from the source in the VFile. `runSync(tree)` without a file is a documented limit, pinned here so a change to it is deliberate.
    const input = String.raw`\--a-- --b--`;
    expect(String(cmProcessor.processSync(input))).toBe(
      "<p>--a-- <del>b</del></p>"
    );
    const tree = unified().use(remarkParse).parse(input);
    const [paragraph] = unified().use(remarkDel).runSync(tree).children;
    expect(paragraph?.type === "paragraph" && paragraph.children[0]?.type).toBe(
      "delete"
    );
  });
});
