import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { markdownToHtml } from "satteri";
import { normalizeHtml, parseFixture } from "../utils/index.js";
import { parityCases } from "./parity-cases.js";

// Sätteri parses definition lists natively, so there is no sat-definition-list package: these tests check that its `definitionList` feature renders what the markdown-it and remark plugins do, which is the parity contract for this set.

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cmCases = parseFixture(
  read("fixtures/definition-list-commonmark.md"),
  read("expected/definition-list-commonmark.html")
);

const render = (input: string, gfm = false): string =>
  normalizeHtml(
    markdownToHtml(input, {
      features: {
        gfm,
        definitionList: true,
        frontmatter: false,
        smartPunctuation: false
      }
    }).html
  );

describe("definition-list/sat", () => {
  it.each(cmCases)(
    "definition-list (sätteri): $name",
    ({ input, expected }) => {
      expect(render(input)).toBe(expected);
    }
  );

  it.each(parityCases)(
    "definition-list (sätteri) parity: $name",
    ({ input, expected }) => {
      expect(render(input)).toBe(expected);
    }
  );
});
