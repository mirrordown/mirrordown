import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { remarkCaption } from "../../packages/remd-caption/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cmCases = parseFixture(
  read("fixtures/caption-commonmark.md"),
  read("expected/caption-commonmark.html")
);
const gfmCases = parseFixture(
  read("fixtures/caption-gfm.md"),
  read("expected/caption-gfm.html")
);

const processor = (gfm: boolean) =>
  unified()
    .use(remarkParse)
    .use(gfm ? [remarkGfm] : [])
    .use(remarkCaption)
    .use(remarkRehype)
    .use(rehypeStringify);

const render = (input: string, gfm = false) =>
  normalizeHtml(String(processor(gfm).processSync(input)));

describe("caption/remd", () => {
  it.each(cmCases)("caption (remark): $name", ({ input, expected }) => {
    expect(render(input)).toBe(expected);
  });

  it.each(gfmCases)("caption (remark) gfm: $name", ({ input, expected }) => {
    expect(render(input, true)).toBe(expected);
  });

  // Caption lines are found by their source, so a tree run without its file has none.
  it("needs the file's value", () => {
    const proc = processor(false);
    const input = "```\ncode\n```\n~: A caption";
    const tree = proc.runSync(proc.parse(input));
    expect(normalizeHtml(proc.stringify(tree))).not.toContain("<figure");
    expect(
      normalizeHtml(proc.stringify(proc.runSync(proc.parse(input), input)))
    ).toContain('<figure class="markdown-caption">');
  });
});
