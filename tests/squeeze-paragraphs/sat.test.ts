import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { markdownToHtml } from "satteri";
import { satteriSqueezeParagraphs } from "../../packages/sat-squeeze-paragraphs/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cases = parseFixture(
  read("fixtures/squeeze-paragraphs.md"),
  read("expected/squeeze-paragraphs.html")
);

const render = (input: string): string =>
  normalizeHtml(
    markdownToHtml(input, {
      features: { gfm: true, frontmatter: false, smartPunctuation: false },
      hastPlugins: [satteriSqueezeParagraphs()]
    }).html
  );

describe("squeeze-paragraphs/sat", () => {
  it.each(cases)(
    "squeeze-paragraphs (sätteri): $name",
    ({ input, expected }) => {
      expect(render(input)).toBe(expected);
    }
  );
});
