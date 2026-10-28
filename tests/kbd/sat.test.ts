import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { markdownToHtml } from "satteri";
import { satteriKbd } from "../../packages/sat-kbd/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cmCases = parseFixture(
  read("fixtures/kbd-commonmark.md"),
  read("expected/kbd-commonmark.html")
);

const gfmCases = parseFixture(
  read("fixtures/kbd-gfm.md"),
  read("expected/kbd-gfm.html")
);

const render = (input: string, gfm: boolean): string =>
  normalizeHtml(
    markdownToHtml(input, {
      features: { gfm, frontmatter: false, smartPunctuation: false },
      mdastPlugins: [satteriKbd()]
    }).html
  );

describe("kbd/sat", () => {
  it.each(cmCases)("kbd (sätteri): $name", ({ input, expected }) => {
    expect(render(input, false)).toBe(expected);
  });

  it.each(gfmCases)("kbd (sätteri) gfm: $name", ({ input, expected }) => {
    expect(render(input, true)).toBe(expected);
  });
});
