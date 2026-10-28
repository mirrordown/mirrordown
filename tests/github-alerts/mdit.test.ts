import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { githubAlerts } from "../../packages/mdit-github-alerts/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cmCases = parseFixture(
  read("fixtures/github-alerts-commonmark.md"),
  read("expected/github-alerts-commonmark.html")
);

const noIconsCases = parseFixture(
  read("fixtures/github-alerts-no-icons.md"),
  read("expected/github-alerts-no-icons.html")
);

const md = new MarkdownIt().use(githubAlerts);
const mdNoIcons = new MarkdownIt().use(githubAlerts, { icons: false });

describe("github-alerts/mdit", () => {
  it.each(cmCases)(
    "github-alerts (markdown-it): $name",
    ({ input, expected }) => {
      expect(normalizeHtml(md.render(input))).toBe(expected);
    }
  );

  it.each(noIconsCases)(
    "github-alerts (markdown-it, icons: false): $name",
    ({ input, expected }) => {
      expect(normalizeHtml(mdNoIcons.render(input))).toBe(expected);
    }
  );
});

// The alert's own tokens nest at the blockquote's level, as markdown-it's would, so plugins that walk tokens by level (attrs, caption) read its structure.
describe("github-alerts/mdit token levels", () => {
  it("nests the title inside the container", () => {
    const tokens = md.parse("> [!NOTE]\n> Body.", {});
    expect(
      tokens.map(({ type, level }) => `${type}@${level}`).slice(0, 4)
    ).toStrictEqual(["div_open@0", "p_open@1", "inline@2", "p_close@1"]);
    expect(tokens.at(-1)).toMatchObject({ type: "div_close", level: 0 });
  });
});
