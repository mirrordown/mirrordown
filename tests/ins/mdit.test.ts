import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { ins } from "../../packages/mdit-ins/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cmCases = parseFixture(
  read("fixtures/ins-commonmark.md"),
  read("expected/ins-commonmark.html")
);

const gfmCases = parseFixture(
  read("fixtures/ins-gfm.md"),
  read("expected/ins-gfm.html")
);

const md = new MarkdownIt().use(ins);

describe("ins/mdit", () => {
  it.each(cmCases)("ins (markdown-it): $name", ({ input, expected }) => {
    expect(normalizeHtml(md.render(input))).toBe(expected);
  });

  it.each(gfmCases)("ins (markdown-it) gfm: $name", ({ input, expected }) => {
    expect(normalizeHtml(md.render(input))).toBe(expected);
  });
});
