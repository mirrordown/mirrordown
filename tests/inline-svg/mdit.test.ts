import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test, describe } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { inlineSvg, type Options } from "@saeris/mdit-inline-svg";
import { parseCases } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");
const cases = parseCases(read("fixtures/inline-svg.md"));

const defaultMd = new MarkdownIt().use(inlineSvg);

const withOptions = (options: Partial<Options>) => new MarkdownIt().use(inlineSvg, options);

const env = { currentDocument: import.meta.url };

// Tier 1: named cases — default options, snapshot output
test.each(cases)("inline-svg (markdown-it): $name", ({ input }) => {
  expect(defaultMd.render(input, env)).toMatchSnapshot();
});

// Tier 2: options behavior
describe("inline-svg (markdown-it) maxImageSize", () => {
  test("0 — nothing inlined", () => {
    const result = withOptions({ maxImageSize: 0 }).render(
      `![](./fixtures/circle.inline.svg)`,
      env,
    );
    expect(result).toContain(`<img`);
    expect(result).not.toContain(`<svg`);
  });

  test("below file size — nothing inlined", () => {
    const result = withOptions({ maxImageSize: 10 }).render(
      `![](./fixtures/circle.inline.svg)`,
      env,
    );
    expect(result).toContain(`<img`);
    expect(result).not.toContain(`<svg`);
  });

  test("Infinity — large SVGs inlined", () => {
    const result = withOptions({ maxImageSize: Infinity }).render(
      `![](./fixtures/castle.svg)`,
      env,
    );
    expect(result).toContain(`<svg`);
    expect(result).not.toContain(`<img`);
  });
});

describe("inline-svg (markdown-it) maxOccurrences", () => {
  test("0 — nothing inlined", () => {
    const result = withOptions({ maxOccurrences: 0 }).render(
      `![](./fixtures/circle.inline.svg)`,
      env,
    );
    expect(result).toContain(`<img`);
    expect(result).not.toContain(`<svg`);
  });

  test("1 — skips SVG appearing more than once", () => {
    const input = `![](./fixtures/flower.svg)\n\n![](./fixtures/flower.svg)`;
    const result = withOptions({ maxOccurrences: 1 }).render(input, env);
    expect(result).not.toContain(`<svg`);
  });
});

describe("inline-svg (markdown-it) maxTotalSize", () => {
  test("0 — nothing inlined", () => {
    const result = withOptions({ maxTotalSize: 0 }).render(
      `![](./fixtures/circle.inline.svg)`,
      env,
    );
    expect(result).toContain(`<img`);
    expect(result).not.toContain(`<svg`);
  });

  test("Infinity — many occurrences of same SVG all inlined", () => {
    const many = Array.from({ length: 20 }, () => `![](./fixtures/flower.svg)`).join(`\n\n`);
    const result = withOptions({ maxTotalSize: Infinity }).render(many, env);
    expect(result.match(/<svg/g)?.length).toBe(20);
  });
});

describe("inline-svg (markdown-it) optimize", () => {
  test("false — inlines raw SVG without SVGO", () => {
    const result = withOptions({ optimize: false }).render(
      `![](./fixtures/circle.inline.svg)`,
      env,
    );
    expect(result).toContain(`<svg`);
    expect(result).toContain(`#BA5B5B`);
  });

  test("true (default) — SVGO lowercases hex colors", () => {
    const result = defaultMd.render(`![](./fixtures/circle.inline.svg)`, env);
    expect(result).toContain(`<svg`);
    expect(result).toContain(`#ba5b5b`);
  });
});

describe("inline-svg (markdown-it) cacheEfficiency", () => {
  test("reports 0 hits and 1 miss for a first-seen SVG", () => {
    const hits: number[] = [];
    const misses: number[] = [];
    withOptions({
      cacheEfficiency: ({ hits: h, misses: m }) => {
        hits.push(h);
        misses.push(m);
      },
    }).render(`![](./fixtures/circle.inline.svg)`, env);
    expect(hits).toStrictEqual([0]);
    expect(misses).toStrictEqual([1]);
  });
});

describe("inline-svg (markdown-it) deduplication", () => {
  test("uses sprite + use for repeated SVG", () => {
    const input = `![icon](./fixtures/flower.svg)\n\n![icon](./fixtures/flower.svg)`;
    const result = withOptions({ deduplication: true }).render(input, env);
    expect(result).toContain(`<symbol`);
    expect(result).toContain(`<use`);
    expect(result.match(/<use/g)?.length).toBe(2);
  });

  test("fully inlines single-occurrence SVG regardless of deduplication flag", () => {
    const result = withOptions({ deduplication: true }).render(`![](./fixtures/flower.svg)`, env);
    expect(result).not.toContain(`<symbol`);
    expect(result).not.toContain(`<use`);
    expect(result).toContain(`<svg`);
  });
});

describe("inline-svg (markdown-it) fallback behavior", () => {
  test("passes through when no currentDocument in env", () => {
    const result = defaultMd.render(`![](./fixtures/test.svg)`);
    expect(result).toContain(`<img`);
    expect(result).not.toContain(`<svg`);
  });
});
