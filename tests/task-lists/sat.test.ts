import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { markdownToHtml } from "satteri";
import { satteriTaskLists } from "../../packages/sat-task-lists/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cmCases = parseFixture(
  read("fixtures/task-lists-commonmark.md"),
  read("expected/task-lists-commonmark.html")
);

const gfmCases = parseFixture(
  read("fixtures/task-lists-gfm.md"),
  read("expected/task-lists-gfm.html")
);

const render = (input: string, gfm: boolean): string =>
  normalizeHtml(
    markdownToHtml(input, {
      features: { gfm, frontmatter: false, smartPunctuation: false },
      mdastPlugins: [satteriTaskLists()]
    }).html
  );

describe("task-lists/sat", () => {
  it.each(cmCases)("task-lists (sätteri): $name", ({ input, expected }) => {
    expect(render(input, false)).toBe(expected);
  });

  // With GFM on, Sätteri has read `[ ]` and `[x]` while parsing, and the plugin reads the rest: the same cases must come out the same.
  it.each(cmCases)(
    "task-lists (sätteri) with GFM: $name",
    ({ input, expected }) => {
      expect(render(input, true)).toBe(expected);
    }
  );

  it.each(gfmCases)(
    "task-lists (sätteri) gfm: $name",
    ({ input, expected }) => {
      expect(render(input, true)).toBe(expected);
    }
  );
});
