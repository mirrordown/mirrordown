import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { taskLists } from "../../packages/mdit-task-lists/src";
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

const md = new MarkdownIt().use(taskLists);

describe("task-lists/mdit", () => {
  it.each(cmCases)("task-lists (markdown-it): $name", ({ input, expected }) => {
    expect(normalizeHtml(md.render(input))).toBe(expected);
  });

  it.each(gfmCases)(
    "task-lists (markdown-it) gfm: $name",
    ({ input, expected }) => {
      expect(normalizeHtml(md.render(input))).toBe(expected);
    }
  );
});
