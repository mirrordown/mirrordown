import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { markdownToHtml } from "satteri";
import { satteriSlug } from "../../packages/sat-slug/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cmCases = parseFixture(
  read("fixtures/slug-commonmark.md"),
  read("expected/slug-commonmark.html")
);

const gfmCases = parseFixture(
  read("fixtures/slug-gfm.md"),
  read("expected/slug-gfm.html")
);

// satteriSlug is a hast plugin, so it runs after Sätteri's mdast → hast step.
const render = (input: string, gfm: boolean): string =>
  normalizeHtml(
    markdownToHtml(input, {
      features: { gfm, frontmatter: false, smartPunctuation: false },
      hastPlugins: [satteriSlug()]
    }).html
  );

describe("slug/sat", () => {
  it.each(cmCases)("slug (sätteri): $name", ({ input, expected }) => {
    expect(render(input, false)).toBe(expected);
  });

  it.each(gfmCases)("slug (sätteri): $name", ({ input, expected }) => {
    expect(render(input, true)).toBe(expected);
  });
});
