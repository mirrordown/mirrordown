import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { lightbox } from "../../packages/mdit-lightbox/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cmCases = parseFixture(
  read("fixtures/lightbox-commonmark.md"),
  read("expected/lightbox-commonmark.html")
);

const gfmCases = parseFixture(
  read("fixtures/lightbox-gfm.md"),
  read("expected/lightbox-gfm.html")
);

const md = new MarkdownIt().use(lightbox);

describe("lightbox/mdit", () => {
  it.each(cmCases)("lightbox (markdown-it): $name", ({ input, expected }) => {
    expect(normalizeHtml(md.render(input))).toBe(expected);
  });

  it.each(gfmCases)(
    "lightbox (markdown-it) gfm: $name",
    ({ input, expected }) => {
      expect(normalizeHtml(md.render(input))).toBe(expected);
    }
  );
});
