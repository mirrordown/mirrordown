import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { tabs } from "../../packages/mdit-tabs/src";
import { parseCases, normalizeHtml } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cases = parseCases(read("fixtures/tabs.md"));

const md = new MarkdownIt().use(tabs);

describe("tabs/mdit", () => {
  it.each(cases)("tabs (markdown-it): $name", ({ input }) => {
    expect(normalizeHtml(md.render(input))).toMatchSnapshot();
  });
});
