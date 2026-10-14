import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { attrs } from "../../packages/mdit-attrs/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cases = parseFixture(
  read("fixtures/attrs.md"),
  read("expected/attrs.html")
);

// markdown-it renders GFM strikethrough as <s>, remark as <del>
const mditCases = parseFixture(
  read("fixtures/attrs-mdit.md"),
  read("expected/attrs-mdit.html")
);

const md = new MarkdownIt().use(attrs);

describe("attrs/mdit", () => {
  it.each([...cases, ...mditCases])(
    "attrs (markdown-it): $name",
    ({ input, expected }) => {
      expect(normalizeHtml(md.render(input))).toBe(expected);
    }
  );
});
