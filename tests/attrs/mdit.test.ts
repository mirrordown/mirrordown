import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { attrs } from "../../packages/mdit-attrs/src";
import { parseCases, normalizeHtml } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cases = parseCases(read("fixtures/attrs.md"));

const md = new MarkdownIt().use(attrs);

describe("attrs/mdit", () => {
  it.each(cases)("attrs (markdown-it): $name", ({ input }) => {
    expect(normalizeHtml(md.render(input))).toMatchSnapshot();
  });
});
