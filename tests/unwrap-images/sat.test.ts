import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { markdownToHtml } from "satteri";
import { satteriUnwrapImages } from "../../packages/sat-unwrap-images/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cases = parseFixture(
  read("fixtures/unwrap-images.md"),
  read("expected/unwrap-images.html")
);

const render = (input: string): string =>
  normalizeHtml(
    markdownToHtml(input, {
      features: { gfm: false, frontmatter: false, smartPunctuation: false },
      hastPlugins: [satteriUnwrapImages()]
    }).html
  );

describe("unwrap-images/sat", () => {
  it.each(cases)("unwrap-images (sätteri): $name", ({ input, expected }) => {
    expect(render(input)).toBe(expected);
  });
});
