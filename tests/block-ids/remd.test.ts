import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { remarkBlockIds } from "../../packages/remd-block-ids/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cmCases = parseFixture(
  read("fixtures/block-ids-commonmark.md"),
  read("expected/block-ids-commonmark.html")
);
const gfmCases = parseFixture(
  read("fixtures/block-ids-gfm.md"),
  read("expected/block-ids-gfm.html")
);
const extensionCases = parseFixture(
  read("fixtures/block-ids-gfm-extensions.md"),
  read("expected/block-ids-gfm-extensions.html")
);

const processor = (gfm: boolean) =>
  unified()
    .use(remarkParse)
    .use(gfm ? [remarkGfm] : [])
    .use(remarkBlockIds)
    .use(remarkRehype)
    .use(rehypeStringify);

const render = (input: string, gfm = false) =>
  normalizeHtml(String(processor(gfm).processSync(input)));

describe("block-ids/remd", () => {
  it.each(cmCases)("block-ids (remark): $name", ({ input, expected }) => {
    expect(render(input)).toBe(expected);
  });

  it.each(gfmCases)("block-ids (remark) gfm: $name", ({ input, expected }) => {
    expect(render(input, true)).toBe(expected);
  });

  // markdown-it has no footnotes, task lists or bare-URL links of its own, so these cases are shared with Sätteri only.
  it.each(extensionCases)(
    "block-ids (remark) gfm extensions: $name",
    ({ input, expected }) => {
      expect(render(input, true)).toBe(expected);
    }
  );

  // A marker is read with the file's source (a `^` escaped, or a marker with spaces after it on its line, is text), so a tree run without its file has none.
  it("needs the file's value", () => {
    const proc = processor(false);
    const input = "text ^blk";
    const tree = proc.runSync(proc.parse(input));
    expect(normalizeHtml(proc.stringify(tree))).toBe("<p>text ^blk</p>");
    expect(
      normalizeHtml(proc.stringify(proc.runSync(proc.parse(input), input)))
    ).toBe('<p id="^blk">text</p>');
  });
});
