import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { cjkBreaks } from "../../packages/mdit-cjk-breaks/src";
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

const md = new MarkdownIt().use(cjkBreaks);

describe("cjk-breaks/mdit", () => {
  it.each(cases)("cjk-breaks (markdown-it): $name", ({ input, expected }) => {
    expect(normalizeHtml(comparable(md.render(input)))).toBe(expected);
  });
});
