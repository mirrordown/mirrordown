import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { del } from "../../packages/mdit-del/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cmCases = parseFixture(
  read("fixtures/del-commonmark.md"),
  read("expected/del-commonmark.html")
);

const gfmCases = parseFixture(
  read("fixtures/del-gfm.md"),
  read("expected/del-gfm.html")
);

// tables and ~~strikethrough~~ are built-in to markdown-it's default preset
const md = new MarkdownIt().use(del);

describe("del/mdit", () => {
  it.each(cmCases)("del (markdown-it): $name", ({ input, expected }) => {
    expect(normalizeHtml(md.render(input))).toBe(expected);
  });

  it.each(gfmCases)("del (markdown-it) gfm: $name", ({ input, expected }) => {
    expect(normalizeHtml(md.render(input))).toBe(expected);
  });
});
