import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it, describe } from "vite-plus/test";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import type { Root } from "hast";
import type { Plugin } from "unified";
import { rehypeSqueezeParagraphs } from "../../packages/remd-squeeze-paragraphs/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cases = parseFixture(
  read("fixtures/squeeze-paragraphs.md"),
  read("expected/squeeze-paragraphs.html")
);

const process = (src: string) =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkRehype)
        .use(rehypeSqueezeParagraphs)
        .use(rehypeStringify)
        .processSync(src)
    )
  );

describe("squeeze-paragraphs (rehype)", () => {
  it.each(cases)(
    "squeeze-paragraphs (rehype): $name",
    ({ input, expected }) => {
      expect(process(input)).toBe(expected);
    }
  );
});

// A prior transform that empties a paragraph's contents, leaving residue for
// squeeze to remove. Raw markdown never produces an empty paragraph, so the
// removal behaviour can only be exercised through such an interaction.
const emptyOutParagraphs: Plugin<[], Root> = () => (tree) => {
  const walk = (node: { children?: Root["children"] }): void => {
    if (!node.children) return;
    for (const child of node.children) {
      if (child.type === "element" && child.tagName === "p")
        child.children = [];
      else if ("children" in child) walk(child);
    }
  };
  walk(tree);
};

const processWithResidue = (src: string) =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(remarkRehype)
        .use(emptyOutParagraphs)
        .use(rehypeSqueezeParagraphs)
        .use(rehypeStringify)
        .processSync(src)
    )
  );

describe("squeeze-paragraphs (rehype): removes residue", () => {
  it("drops paragraphs emptied by a prior transform", () => {
    expect(processWithResidue("first\n\nsecond")).toBe("");
  });

  it("leaves surrounding content when only some paragraphs are emptied", () => {
    // Only <p> nodes are emptied; the heading survives, its now-empty
    // paragraph sibling is removed.
    expect(processWithResidue("# Kept\n\nremoved")).toBe("<h1>Kept</h1>");
  });
});
