import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test, describe } from "vite-plus/test";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { rehypeInlineSvg, type Options } from "@saeris/remd-inline-svg";
import { parseCases } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");
const cases = parseCases(read("fixtures/inline-svg.md"));

const process = async (markdown: string, options?: Partial<Options>) => {
  const file = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeInlineSvg, options)
    .use(rehypeStringify)
    .process({ value: markdown, path: fileURLToPath(import.meta.url) });
  return String(file);
};

// Tier 1: named cases — default options, snapshot output
test.each(cases)("inline-svg (rehype): $name", async ({ input }) => {
  expect(await process(input)).toMatchSnapshot();
});

// Tier 2: options behavior
describe("inline-svg (rehype) maxImageSize", () => {
  test("0 — nothing inlined", async () => {
    const result = await process(`![](./fixtures/circle.inline.svg)`, { maxImageSize: 0 });
    expect(result).toContain(`<img`);
    expect(result).not.toContain(`<svg`);
  });

  test("below file size — nothing inlined", async () => {
    const result = await process(`![](./fixtures/circle.inline.svg)`, { maxImageSize: 10 });
    expect(result).toContain(`<img`);
    expect(result).not.toContain(`<svg`);
  });

  test("Infinity — large SVGs inlined", async () => {
    const result = await process(`![](./fixtures/castle.svg)`, { maxImageSize: Infinity });
    expect(result).toContain(`<svg`);
    expect(result).not.toContain(`<img`);
  });
});

describe("inline-svg (rehype) maxOccurrences", () => {
  test("0 — nothing inlined", async () => {
    const result = await process(`![](./fixtures/circle.inline.svg)`, { maxOccurrences: 0 });
    expect(result).toContain(`<img`);
    expect(result).not.toContain(`<svg`);
  });

  test("1 — skips SVG appearing more than once", async () => {
    const input = `![](./fixtures/flower.svg)\n\n![](./fixtures/flower.svg)`;
    const result = await process(input, { maxOccurrences: 1 });
    expect(result).not.toContain(`<svg`);
  });
});

describe("inline-svg (rehype) maxTotalSize", () => {
  test("0 — nothing inlined", async () => {
    const result = await process(`![](./fixtures/circle.inline.svg)`, { maxTotalSize: 0 });
    expect(result).toContain(`<img`);
    expect(result).not.toContain(`<svg`);
  });

  test("Infinity — many occurrences of same SVG all inlined", async () => {
    const many = Array.from({ length: 20 }, () => `![](./fixtures/flower.svg)`).join(`\n\n`);
    const result = await process(many, { maxTotalSize: Infinity });
    expect(result.match(/<svg/g)?.length).toBe(20);
  });
});

describe("inline-svg (rehype) optimize", () => {
  test("false — inlines raw SVG without SVGO", async () => {
    const result = await process(`![](./fixtures/circle.inline.svg)`, { optimize: false });
    expect(result).toContain(`<svg`);
    expect(result).toContain(`#BA5B5B`);
  });

  test("true (default) — SVGO lowercases hex colors", async () => {
    const result = await process(`![](./fixtures/circle.inline.svg)`);
    expect(result).toContain(`<svg`);
    expect(result).toContain(`#ba5b5b`);
  });
});

describe("inline-svg (rehype) cacheEfficiency", () => {
  test("reports 0 hits and 1 miss for a first-seen SVG", async () => {
    const hits: number[] = [];
    const misses: number[] = [];
    await process(`![](./fixtures/circle.inline.svg)`, {
      cacheEfficiency: ({ hits: h, misses: m }) => {
        hits.push(h);
        misses.push(m);
      },
    });
    expect(hits).toStrictEqual([0]);
    expect(misses).toStrictEqual([1]);
  });
});

describe("inline-svg (rehype) deduplication", () => {
  test("uses sprite + use for repeated SVG", async () => {
    const input = `![icon](./fixtures/flower.svg)\n\n![icon](./fixtures/flower.svg)`;
    const result = await process(input, { deduplication: true });
    expect(result).toContain(`<symbol`);
    expect(result).toContain(`<use`);
    expect(result.match(/<use/g)?.length).toBe(2);
  });

  test("fully inlines single-occurrence SVG regardless of deduplication flag", async () => {
    const result = await process(`![](./fixtures/flower.svg)`, { deduplication: true });
    expect(result).not.toContain(`<symbol`);
    expect(result).not.toContain(`<use`);
    expect(result).toContain(`<svg`);
  });
});
