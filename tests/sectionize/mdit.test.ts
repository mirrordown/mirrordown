import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it, describe } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { sectionize } from "../../packages/mdit-sectionize/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cases = parseFixture(
  read("fixtures/sectionize.md"),
  read("expected/sectionize.html")
);

const md = new MarkdownIt().use(sectionize);
const render = (src: string) => normalizeHtml(md.render(src));

describe("sectionize (markdown-it)", () => {
  it.each(cases)("sectionize (markdown-it): $name", ({ input, expected }) => {
    expect(render(input)).toBe(expected);
  });
});
