import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { dl } from "../../packages/mdit-definition-list/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";
import { parityCases } from "./parity-cases.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cmCases = parseFixture(
  read("fixtures/definition-list-commonmark.md"),
  read("expected/definition-list-commonmark.html")
);

const md = new MarkdownIt().use(dl);
// Raw HTML on, as remark and Sätteri have it, for the case that needs an HTML block
const htmlMd = new MarkdownIt({ html: true }).use(dl);

describe("definition-list/mdit", () => {
  it.each(cmCases)(
    "definition-list (markdown-it): $name",
    ({ input, expected }) => {
      expect(normalizeHtml(md.render(input))).toBe(expected);
    }
  );

  it.each(parityCases)(
    "definition-list (markdown-it) parity: $name",
    ({ input, expected }) => {
      expect(normalizeHtml(htmlMd.render(input))).toBe(expected);
    }
  );
});
