import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { markdownToHtml } from "satteri";
import { satteriSteps } from "../../packages/sat-steps/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cases = parseFixture(
  read("fixtures/steps.md"),
  read("expected/steps.html")
);

const render = (input: string): string =>
  normalizeHtml(
    markdownToHtml(input, {
      features: { gfm: false, frontmatter: false, smartPunctuation: false },
      mdastPlugins: [satteriSteps()]
    }).html
  );

describe("steps/sat", () => {
  it.each(cases)("steps (sätteri): $name", ({ input, expected }) => {
    expect(render(input)).toBe(expected);
  });
});
