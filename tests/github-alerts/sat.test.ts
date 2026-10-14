import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { markdownToHtml } from "satteri";
import { satteriGithubAlerts } from "../../packages/sat-github-alerts/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cmCases = parseFixture(
  read("fixtures/github-alerts-commonmark.md"),
  read("expected/github-alerts-commonmark.html")
);

const noIconsCases = parseFixture(
  read("fixtures/github-alerts-no-icons.md"),
  read("expected/github-alerts-no-icons.html")
);

const render = (input: string, icons: boolean): string =>
  normalizeHtml(
    markdownToHtml(input, {
      features: { gfm: false, frontmatter: false, smartPunctuation: false },
      mdastPlugins: [satteriGithubAlerts({ icons })]
    }).html
  );

describe("github-alerts/sat", () => {
  it.each(cmCases)("github-alerts (sätteri): $name", ({ input, expected }) => {
    expect(render(input, true)).toBe(expected);
  });

  it.each(noIconsCases)(
    "github-alerts (sätteri, icons: false): $name",
    ({ input, expected }) => {
      expect(render(input, false)).toBe(expected);
    }
  );
});
