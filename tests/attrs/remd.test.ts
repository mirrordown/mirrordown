import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { remarkAttrs } from "../../packages/remd-attrs/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cases = parseFixture(
  read("fixtures/attrs.md"),
  read("expected/attrs.html")
);

// markdown-it renders GFM strikethrough as <s>, remark as <del>
const remdCases = parseFixture(
  read("fixtures/attrs-remd.md"),
  read("expected/attrs-remd.html")
);

const remd = (src: string) =>
  normalizeHtml(
    String(
      unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkAttrs)
        .use(remarkRehype)
        .use(rehypeStringify)
        .processSync(src)
    )
  );

describe("attrs/remd", () => {
  it.each([...cases, ...remdCases])(
    "attrs (remark): $name",
    ({ input, expected }) => {
      expect(remd(input)).toBe(expected);
    }
  );
});
