import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { markdownToHtml } from "satteri";
import { satteriTabs } from "../../packages/sat-tabs/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cases = parseFixture(
  read("fixtures/tabs.md"),
  read("expected/tabs.html")
);

const render = (input: string): string =>
  normalizeHtml(
    markdownToHtml(input, {
      features: { gfm: true, frontmatter: false, smartPunctuation: false },
      mdastPlugins: [satteriTabs()]
    }).html
  );

describe("tabs/sat", () => {
  it.each(cases)("tabs (sätteri): $name", ({ input, expected }) => {
    expect(render(input)).toBe(expected);
  });
});
