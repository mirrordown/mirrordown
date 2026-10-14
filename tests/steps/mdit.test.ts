import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { steps } from "../../packages/mdit-steps/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cases = parseFixture(
  read("fixtures/steps.md"),
  read("expected/steps.html")
);

const md = new MarkdownIt().use(steps);

describe("steps/mdit", () => {
  it.each(cases)("steps (markdown-it): $name", ({ input, expected }) => {
    expect(normalizeHtml(md.render(input))).toBe(expected);
  });
});
