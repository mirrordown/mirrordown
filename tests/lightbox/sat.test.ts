import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { markdownToHtml } from "satteri";
import { satteriLightbox } from "../../packages/sat-lightbox/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cmCases = parseFixture(
  read("fixtures/lightbox-commonmark.md"),
  read("expected/lightbox-commonmark.html")
);

const gfmCases = parseFixture(
  read("fixtures/lightbox-gfm.md"),
  read("expected/lightbox-gfm.html")
);

const render = (input: string, gfm: boolean): string =>
  normalizeHtml(
    markdownToHtml(input, {
      features: { gfm, frontmatter: false, smartPunctuation: false },
      hastPlugins: [satteriLightbox()]
    }).html
  );

describe("lightbox/sat", () => {
  it.each(cmCases)("lightbox (sätteri): $name", ({ input, expected }) => {
    expect(render(input, false)).toBe(expected);
  });

  it.each(gfmCases)("lightbox (sätteri) gfm: $name", ({ input, expected }) => {
    expect(render(input, true)).toBe(expected);
  });
});
