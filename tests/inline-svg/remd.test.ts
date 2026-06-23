import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, it, describe } from "vite-plus/test";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import {
  rehypeInlineSvg,
  type Options
} from "../../packages/remd-inline-svg/src";
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
describe("inline-svg (rehype)", () => {
  it.each(cases)("inline-svg (rehype): $name", async ({ input }) => {
    await expect(process(input)).resolves.toMatchSnapshot();
  });
});

// Tier 2: options behavior
describe("inline-svg (rehype) maxImageSize", () => {
  it("0 — nothing inlined", async () => {
    const result = await process(`![](./fixtures/circle.inline.svg)`, {
      maxImageSize: 0
    });
    expect(result).toContain(`<img`);
    expect(result).not.toContain(`<svg`);
  });

  it("below file size — nothing inlined", async () => {
    const result = await process(`![](./fixtures/circle.inline.svg)`, {
      maxImageSize: 10
    });
    expect(result).toContain(`<img`);
    expect(result).not.toContain(`<svg`);
  });

  it("infinity — large SVGs inlined", async () => {
    const result = await process(`![](./fixtures/castle.svg)`, {
      maxImageSize: Infinity
    });
    expect(result).toContain(`<svg`);
    expect(result).not.toContain(`<img`);
  });
});

describe("inline-svg (rehype) maxOccurrences", () => {
  it("0 — nothing inlined", async () => {
    const result = await process(`![](./fixtures/circle.inline.svg)`, {
      maxOccurrences: 0
    });
    expect(result).toContain(`<img`);
    expect(result).not.toContain(`<svg`);
  });

  it("1 — skips SVG appearing more than once", async () => {
    const input = `![](./fixtures/flower.svg)\n\n![](./fixtures/flower.svg)`;
    const result = await process(input, { maxOccurrences: 1 });
    expect(result).not.toContain(`<svg`);
  });
});

describe("inline-svg (rehype) maxTotalSize", () => {
  it("0 — nothing inlined", async () => {
    const result = await process(`![](./fixtures/circle.inline.svg)`, {
      maxTotalSize: 0
    });
    expect(result).toContain(`<img`);
    expect(result).not.toContain(`<svg`);
  });

  it("infinity — many occurrences of same SVG all inlined", async () => {
    const many = Array.from(
      { length: 20 },
      () => `![](./fixtures/flower.svg)`
    ).join(`\n\n`);
    const result = await process(many, { maxTotalSize: Infinity });
    expect(result.match(/<svg/g)?.length).toBe(20);
  });
});

describe("inline-svg (rehype) optimize", () => {
  it("false — inlines raw SVG without SVGO", async () => {
    const result = await process(`![](./fixtures/circle.inline.svg)`, {
      optimize: false
    });
    expect(result).toContain(`<svg`);
    expect(result).toContain(`#BA5B5B`);
  });

  it("true (default) — SVGO lowercases hex colors", async () => {
    const result = await process(`![](./fixtures/circle.inline.svg)`);
    expect(result).toContain(`<svg`);
    expect(result).toContain(`#ba5b5b`);
  });
});

describe("inline-svg (rehype) cacheEfficiency", () => {
  it("reports 0 hits and 1 miss for a first-seen SVG", async () => {
    const hits: number[] = [];
    const misses: number[] = [];
    await process(`![](./fixtures/circle.inline.svg)`, {
      cacheEfficiency: ({ hits: h, misses: m }) => {
        hits.push(h);
        misses.push(m);
      }
    });
    expect(hits).toStrictEqual([0]);
    expect(misses).toStrictEqual([1]);
  });
});

describe("inline-svg (rehype) deduplication", () => {
  it("uses sprite + use for repeated SVG", async () => {
    const input = `![icon](./fixtures/flower.svg)\n\n![icon](./fixtures/flower.svg)`;
    const result = await process(input, { deduplication: true });
    expect(result).toContain(`<symbol`);
    expect(result).toContain(`<use`);
    expect(result.match(/<use/g)?.length).toBe(2);
  });

  it("fully inlines single-occurrence SVG regardless of deduplication flag", async () => {
    const result = await process(`![](./fixtures/flower.svg)`, {
      deduplication: true
    });
    expect(result).not.toContain(`<symbol`);
    expect(result).not.toContain(`<use`);
    expect(result).toContain(`<svg`);
  });
});
