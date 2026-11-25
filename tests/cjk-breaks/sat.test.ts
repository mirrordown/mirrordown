import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { markdownToHtml } from "satteri";
import { satteriCjkBreaks } from "../../packages/sat-cjk-breaks/src";
import { comparable } from "../utils/hostile.js";
import { normalizeHtml, parseFixture } from "../utils/index.js";
import { withLineEndings } from "./line-endings.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cases = withLineEndings(
  parseFixture(
    read("fixtures/cjk-breaks-commonmark.md"),
    read("expected/cjk-breaks-commonmark.html")
  )
);

const render = (input: string): string =>
  normalizeHtml(
    comparable(
      markdownToHtml(input, {
        features: { gfm: false, frontmatter: false, smartPunctuation: false },
        mdastPlugins: [satteriCjkBreaks()]
      }).html
    )
  );

describe("cjk-breaks/sat", () => {
  it.each(cases)("cjk-breaks (sätteri): $name", ({ input, expected }) => {
    expect(render(input)).toBe(expected);
  });
});
