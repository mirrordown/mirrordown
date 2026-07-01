import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { spoiler } from "../../packages/mdit-spoiler/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cmCases = parseFixture(
  read("fixtures/spoiler-commonmark.md"),
  read("expected/spoiler-commonmark.html")
);

const gfmCases = parseFixture(
  read("fixtures/spoiler-gfm.md"),
  read("expected/spoiler-gfm.html")
);

const md = new MarkdownIt().use(spoiler);

describe("spoiler/mdit", () => {
  it.each(cmCases)("spoiler (markdown-it): $name", ({ input, expected }) => {
    expect(normalizeHtml(md.render(input))).toBe(expected);
  });

  it.each(gfmCases)(
    "spoiler (markdown-it) gfm: $name",
    ({ input, expected }) => {
      expect(normalizeHtml(md.render(input))).toBe(expected);
    }
  );
});
