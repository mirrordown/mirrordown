import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { remarkSub } from "../../packages/remd-sub/src";
import { remarkSup } from "../../packages/remd-sup/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cmCases = parseFixture(
  read("fixtures/sub-commonmark.md"),
  read("expected/sub-commonmark.html")
);

const gfmCases = parseFixture(
  read("fixtures/sub-gfm.md"),
  read("expected/sub-gfm.html")
);

const crossNodeCases = parseFixture(
  read("fixtures/sub-cross-node.md"),
  read("expected/sub-cross-node.html")
);

const subSupCases = parseFixture(
  read("fixtures/sub-sup.md"),
  read("expected/sub-sup.html")
);

// Both registration orders: which plugin is added first must not change how crossing runs pair.
const subSupOrders = [
  [
    "sub, sup",
    unified()
      .use(remarkParse)
      .use(remarkSub)
      .use(remarkSup)
      .use(remarkRehype)
      .use(rehypeStringify)
  ],
  [
    "sup, sub",
    unified()
      .use(remarkParse)
      .use(remarkSup)
      .use(remarkSub)
      .use(remarkRehype)
      .use(rehypeStringify)
  ]
] as const;

const cmProcessor = unified()
  .use(remarkParse)
  .use(remarkSub)
  .use(remarkRehype)
  .use(rehypeStringify);

const gfmProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm, { singleTilde: false })
  .use(remarkSub)
  .use(remarkRehype)
  .use(rehypeStringify);

describe("sub/remd", () => {
  it.each(cmCases)("sub (remark): $name", ({ input, expected }) => {
    expect(normalizeHtml(String(cmProcessor.processSync(input)))).toBe(
      expected
    );
  });

  it.each(gfmCases)("sub (remark) gfm: $name", ({ input, expected }) => {
    expect(normalizeHtml(String(gfmProcessor.processSync(input)))).toBe(
      expected
    );
  });

  describe.each(subSupOrders)("with sup (%s)", (_, processor) => {
    it.each(subSupCases)(
      "sub (remark) with sup: $name",
      ({ input, expected }) => {
        expect(normalizeHtml(String(processor.processSync(input)))).toBe(
          expected
        );
      }
    );
  });

  it.each(crossNodeCases)(
    "sub (remark) cross-node: $name",
    ({ input, expected }) => {
      expect(normalizeHtml(String(cmProcessor.processSync(input)))).toBe(
        expected
      );
    }
  );
});
