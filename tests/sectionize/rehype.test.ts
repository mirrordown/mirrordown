import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it, describe } from "vite-plus/test";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { rehypeSectionize } from "../../packages/remd-sectionize/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cases = parseFixture(
  read("fixtures/sectionize.md"),
  read("expected/sectionize.html")
);

const process = (src: string) =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkRehype)
        .use(rehypeSectionize)
        .use(rehypeStringify)
        .processSync(src)
    )
  );

describe("sectionize (rehype)", () => {
  it.each(cases)("sectionize (rehype): $name", ({ input, expected }) => {
    expect(process(input)).toBe(expected);
  });
});
