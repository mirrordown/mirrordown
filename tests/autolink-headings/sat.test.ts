import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { markdownToHtml } from "satteri";
import { satteriSlug } from "../../packages/sat-slug/src";
import { satteriAutolinkHeadings } from "../../packages/sat-autolink-headings/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cmCases = parseFixture(
  read("fixtures/autolink-headings-commonmark.md"),
  read("expected/autolink-headings-commonmark.html")
);

const gfmCases = parseFixture(
  read("fixtures/autolink-headings-gfm.md"),
  read("expected/autolink-headings-gfm.html")
);

const render = (input: string, gfm: boolean): string =>
  normalizeHtml(
    markdownToHtml(input, {
      features: { gfm, frontmatter: false, smartPunctuation: false },
      hastPlugins: [satteriSlug(), satteriAutolinkHeadings()]
    }).html
  );

describe("autolink-headings/sat", () => {
  it.each(cmCases)("autolink (sätteri): $name", ({ input, expected }) => {
    expect(render(input, false)).toBe(expected);
  });

  it.each(gfmCases)("autolink (sätteri) gfm: $name", ({ input, expected }) => {
    expect(render(input, true)).toBe(expected);
  });
});
