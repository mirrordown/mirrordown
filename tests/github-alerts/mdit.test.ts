import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { githubAlerts } from "../../packages/mdit-github-alerts/src";
import { parseCases, normalizeHtml } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cases = parseCases(read("fixtures/github-alerts-commonmark.md"));
const mainCases = cases.filter(({ name }) => name !== "no icons");
const noIconsCase = cases.find(({ name }) => name === "no icons")!;

const md = new MarkdownIt().use(githubAlerts);
const mdNoIcons = new MarkdownIt().use(githubAlerts, { icons: false });

describe("github-alerts/mdit", () => {
  it.each(mainCases)("github-alerts (markdown-it): $name", ({ input }) => {
    expect(normalizeHtml(md.render(input))).toMatchSnapshot();
  });

  it("github-alerts (markdown-it): no icons", () => {
    expect(
      normalizeHtml(mdNoIcons.render(noIconsCase.input))
    ).toMatchSnapshot();
  });
});
