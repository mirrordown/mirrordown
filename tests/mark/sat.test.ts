import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { markdownToHtml } from "satteri";
import { satteriMark } from "../../packages/sat-mark/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cmCases = parseFixture(
  read("fixtures/mark-commonmark.md"),
  read("expected/mark-commonmark.html")
);

const gfmCases = parseFixture(
  read("fixtures/mark-gfm.md"),
  read("expected/mark-gfm.html")
);

const render = (input: string, gfm: boolean): string =>
  normalizeHtml(
    markdownToHtml(input, {
      features: { gfm, frontmatter: false, smartPunctuation: false },
      mdastPlugins: [satteriMark()]
    }).html
  );

describe("mark/sat", () => {
  it.each(cmCases)("mark (sätteri): $name", ({ input, expected }) => {
    expect(render(input, false)).toBe(expected);
  });

  it.each(gfmCases)("mark (sätteri) gfm: $name", ({ input, expected }) => {
    expect(render(input, true)).toBe(expected);
  });
});
