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

const process = async (markdown: string, options?: Partial<Options>) => {
  const file = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeInlineSvg, options)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process({ value: markdown, path: fileURLToPath(import.meta.url) });
  return String(file);
};

// Tier 1: named cases, shared with mdit
describe("inline-svg (rehype)", () => {
  it.each(cases)("inline-svg (rehype): $name", async ({ input, expected }) => {
    expect(normalizeHtml(await process(input))).toBe(expected);
  });

  it.each(dedupCases)(
    "inline-svg (rehype, deduplication): $name",
    async ({ input, expected }) => {
      const html = await process(input, { deduplication: true });
      expect(normalizeHtml(html)).toBe(expected);
    }
  );
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
  // Ids end up in published HTML, so they must not depend on where the
  // project lives: they hash the SVG's path relative to the document.
  it("sprite id derives from the document-relative path", async () => {
    const result = await process(
      `![](./fixtures/flower.svg)

![](./fixtures/flower.svg)`,
      { deduplication: true }
    );
    expect(result).toContain(`id="${svgSpriteId("fixtures/flower.svg")}"`);
  });

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

describe("inline-svg (rehype) failures and shared instances", () => {
  const path = fileURLToPath(import.meta.url);
  const shared = () =>
    unified()
      .use(remarkParse)
      .use(remarkRehype)
      .use(rehypeInlineSvg)
      .use(rehypeStringify, { allowDangerousHtml: true });

  // A build reuses one processor for every page, so one page's broken image must not reject the pages after it, and the failure must not be remembered: the file may exist by the next render.
  it("a file that can't be read affects only its own image, in this and later documents", async () => {
    const processor = shared();
    const missing = `![a](./fixtures/nope.svg) ![b](./fixtures/circle.inline.svg)`;
    const first = String(await processor.process({ value: missing, path }));
    expect(first).toContain(`<img src="./fixtures/nope.svg" alt="a">`);
    expect(first).toContain(`<svg`);
    const second = String(
      await processor.process({
        value: `![b](./fixtures/circle.inline.svg)`,
        path
      })
    );
    expect(second).toContain(`<svg`);
    expect(second).not.toContain(`<img`);
  });

  // Documents processed at once share the read of a file; each must wait for it rather than see a half-filled cache and drop its image.
  it("documents processed concurrently each get their images", async () => {
    const processor = shared();
    const results = await Promise.all(
      [`circle.inline`, `flower`, `flower`, `circle.inline`, `flower`].map(
        async (name) =>
          String(
            await processor.process({
              value: `![x](./fixtures/${name}.svg)`,
              path
            })
          )
      )
    );
    for (const html of results) {
      expect(html).toMatch(/^<p><svg [^>]*aria-label="x">.+<\/svg><\/p>$/);
    }
  });

  // Same as the markdown-it and Sätteri plugins without a document location: nothing to resolve against, so nothing is inlined, and nothing throws.
  it("passes through without a file path", async () => {
    const file = await shared().process(`![](./fixtures/test.svg)`);
    expect(String(file)).toBe(`<p><img src="./fixtures/test.svg" alt=""></p>`);
  });
});
