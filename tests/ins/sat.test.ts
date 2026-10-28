import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { markdownToHtml } from "satteri";
import { satteriIns } from "../../packages/sat-ins/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cmCases = parseFixture(
  read("fixtures/ins-commonmark.md"),
  read("expected/ins-commonmark.html")
);

const gfmCases = parseFixture(
  read("fixtures/ins-gfm.md"),
  read("expected/ins-gfm.html")
);

const render = (input: string, gfm: boolean): string =>
  normalizeHtml(
    markdownToHtml(input, {
      features: { gfm, frontmatter: false, smartPunctuation: false },
      mdastPlugins: [satteriIns()]
    }).html
  );

describe("ins/sat", () => {
  it.each(cmCases)("ins (sätteri): $name", ({ input, expected }) => {
    expect(render(input, false)).toBe(expected);
  });

  it.each(gfmCases)("ins (sätteri) gfm: $name", ({ input, expected }) => {
    expect(render(input, true)).toBe(expected);
  });
});
