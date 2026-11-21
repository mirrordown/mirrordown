import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { markdownToHtml } from "satteri";
import { satteriTags } from "../../packages/sat-tags/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cmCases = parseFixture(
  read("fixtures/tags-commonmark.md"),
  read("expected/tags-commonmark.html")
);

const gfmCases = parseFixture(
  read("fixtures/tags-gfm.md"),
  read("expected/tags-gfm.html")
);

const render = (input: string, gfm: boolean): string =>
  normalizeHtml(
    markdownToHtml(input, {
      features: { gfm, frontmatter: false, smartPunctuation: false },
      mdastPlugins: [satteriTags()]
    }).html
  );

describe("tags/sat", () => {
  it.each(cmCases)("tags (sätteri): $name", ({ input, expected }) => {
    expect(render(input, false)).toBe(expected);
  });

  it.each(gfmCases)("tags (sätteri) gfm: $name", ({ input, expected }) => {
    expect(render(input, true)).toBe(expected);
  });
});
