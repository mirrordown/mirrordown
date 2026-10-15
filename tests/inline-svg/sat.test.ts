import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it, describe } from "vite-plus/test";
import { markdownToHtml } from "satteri";
import {
  satteriInlineSvg,
  type Options
} from "../../packages/sat-inline-svg/src";
import { svgSpriteId } from "../../packages/core/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");
const cases = parseFixture(
  read("fixtures/inline-svg.md"),
  read("expected/inline-svg.html")
);
const dedupCases = parseFixture(
  read("fixtures/inline-svg-deduplication.md"),
  read("expected/inline-svg-deduplication.html")
);

const features = { gfm: false, frontmatter: false, smartPunctuation: false };
const fileURL = new URL(import.meta.url);

// One plugin per options, shared across renders like a markdown-it instance, so its cache carries over.
const withOptions = (options: Partial<Options> = {}) => {
  const plugin = satteriInlineSvg(options);
  // `null` renders without a fileURL.
  return (input: string, url: URL | null = fileURL): string =>
    markdownToHtml(input, {
      features,
      hastPlugins: [plugin],
      ...(url ? { fileURL: url } : {})
    }).html;
};

const render = withOptions();

// Tier 1: named cases, shared with mdit and remd
describe("inline-svg (Sätteri)", () => {
  it.each(cases)("inline-svg (sätteri): $name", ({ input, expected }) => {
    expect(normalizeHtml(render(input))).toBe(expected);
  });

  it.each(dedupCases)(
    "inline-svg (sätteri, deduplication): $name",
    ({ input, expected }) => {
      const dedup = withOptions({ deduplication: true });
      expect(normalizeHtml(dedup(input))).toBe(expected);
    }
  );
});

// Tier 2: options behavior
describe("inline-svg (Sätteri) maxImageSize", () => {
  it("0 — nothing inlined", () => {
    const result = withOptions({ maxImageSize: 0 })(
      `![](./fixtures/circle.inline.svg)`
    );
    expect(result).toContain(`<img`);
    expect(result).not.toContain(`<svg`);
  });

  it("below file size — nothing inlined", () => {
    const result = withOptions({ maxImageSize: 10 })(
      `![](./fixtures/circle.inline.svg)`
    );
    expect(result).toContain(`<img`);
    expect(result).not.toContain(`<svg`);
  });

  it("infinity — large SVGs inlined", () => {
    const result = withOptions({ maxImageSize: Infinity })(
      `![](./fixtures/castle.svg)`
    );
    expect(result).toContain(`<svg`);
    expect(result).not.toContain(`<img`);
  });
});

describe("inline-svg (Sätteri) maxOccurrences", () => {
  it("0 — nothing inlined", () => {
    const result = withOptions({ maxOccurrences: 0 })(
      `![](./fixtures/circle.inline.svg)`
    );
    expect(result).toContain(`<img`);
    expect(result).not.toContain(`<svg`);
  });

  it("1 — skips SVG appearing more than once", () => {
    const input = `![](./fixtures/flower.svg)\n\n![](./fixtures/flower.svg)`;
    const result = withOptions({ maxOccurrences: 1 })(input);
    expect(result).not.toContain(`<svg`);
  });
});

describe("inline-svg (Sätteri) maxTotalSize", () => {
  it("0 — nothing inlined", () => {
    const result = withOptions({ maxTotalSize: 0 })(
      `![](./fixtures/circle.inline.svg)`
    );
    expect(result).toContain(`<img`);
    expect(result).not.toContain(`<svg`);
  });

  it("infinity — many occurrences of same SVG all inlined", () => {
    const many = Array.from(
      { length: 20 },
      () => `![](./fixtures/flower.svg)`
    ).join(`\n\n`);
    const result = withOptions({ maxTotalSize: Infinity })(many);
    expect(result.match(/<svg/g)?.length).toBe(20);
  });
});

describe("inline-svg (Sätteri) optimize", () => {
  it("false — inlines raw SVG without SVGO", () => {
    const result = withOptions({ optimize: false })(
      `![](./fixtures/circle.inline.svg)`
    );
    expect(result).toContain(`<svg`);
    expect(result).toContain(`#BA5B5B`);
  });

  it("true (default) — SVGO lowercases hex colors", () => {
    const result = render(`![](./fixtures/circle.inline.svg)`);
    expect(result).toContain(`<svg`);
    expect(result).toContain(`#ba5b5b`);
  });
});

describe("inline-svg (Sätteri) cacheEfficiency", () => {
  it("reports 0 hits and 1 miss for a first-seen SVG", () => {
    const hits: number[] = [];
    const misses: number[] = [];
    withOptions({
      cacheEfficiency: ({ hits: h, misses: m }) => {
        hits.push(h);
        misses.push(m);
      }
    })(`![](./fixtures/circle.inline.svg)`);
    expect(hits).toStrictEqual([0]);
    expect(misses).toStrictEqual([1]);
  });

  // The cache lives as long as the plugin, so a second document reads nothing.
  it("serves a repeated document from the cache", () => {
    const reports: { hits: number; misses: number }[] = [];
    const twice = withOptions({
      cacheEfficiency: (results) => reports.push(results)
    });
    twice(`![](./fixtures/circle.inline.svg)`);
    twice(`![](./fixtures/circle.inline.svg)`);
    expect(reports).toStrictEqual([
      { hits: 0, misses: 1 },
      { hits: 1, misses: 1 }
    ]);
  });
});

describe("inline-svg (Sätteri) deduplication", () => {
  // Ids end up in published HTML, so they must not depend on where the
  // project lives: they hash the SVG's path relative to the document.
  it("sprite id derives from the document-relative path", () => {
    const result = withOptions({ deduplication: true })(
      `![](./fixtures/flower.svg)

![](./fixtures/flower.svg)`
    );
    expect(result).toContain(`id="${svgSpriteId("fixtures/flower.svg")}"`);
  });

  it("uses sprite + use for repeated SVG", () => {
    const input = `![icon](./fixtures/flower.svg)\n\n![icon](./fixtures/flower.svg)`;
    const result = withOptions({ deduplication: true })(input);
    expect(result).toContain(`<symbol`);
    expect(result).toContain(`<use`);
    expect(result.match(/<use/g)?.length).toBe(2);
  });

  it("fully inlines single-occurrence SVG regardless of deduplication flag", () => {
    const result = withOptions({ deduplication: true })(
      `![](./fixtures/flower.svg)`
    );
    expect(result).not.toContain(`<symbol`);
    expect(result).not.toContain(`<use`);
    expect(result).toContain(`<svg`);
  });
});

describe("inline-svg (Sätteri) fallback behavior", () => {
  it("passes through without a fileURL", () => {
    const result = render(`![](./fixtures/test.svg)`, null);
    expect(result).toContain(`<img`);
    expect(result).not.toContain(`<svg`);
  });
});
