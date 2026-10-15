import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { markdownToHtml } from "satteri";
import { satteriSectionize } from "../../packages/sat-sectionize/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cases = parseFixture(
  read("fixtures/sectionize.md"),
  read("expected/sectionize.html")
);

const render = (input: string): string =>
  normalizeHtml(
    markdownToHtml(input, {
      features: { gfm: true, frontmatter: false, smartPunctuation: false },
      hastPlugins: [satteriSectionize()]
    }).html
  );

describe("sectionize/sat", () => {
  it.each(cases)("sectionize (sätteri): $name", ({ input, expected }) => {
    expect(render(input)).toBe(expected);
  });
});
