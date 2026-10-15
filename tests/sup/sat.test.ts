import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { markdownToHtml } from "satteri";
import { normalizeHtml, parseFixture } from "../utils/index.js";

// Sätteri parses `^sup^` natively, so there is no sat-sup package: these fixtures check that its `superscript` feature renders what the markdown-it and remark plugins do.

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cmCases = parseFixture(
  read("fixtures/sup-commonmark.md"),
  read("expected/sup-commonmark.html")
);

const gfmCases = parseFixture(
  read("fixtures/sup-gfm.md"),
  read("expected/sup-gfm.html")
);

const crossNodeCases = parseFixture(
  read("fixtures/sup-cross-node.md"),
  read("expected/sup-cross-node.html")
);

const render = (input: string, gfm: boolean): string =>
  normalizeHtml(
    markdownToHtml(input, {
      features: {
        gfm,
        superscript: true,
        frontmatter: false,
        smartPunctuation: false
      }
    }).html
  );

describe("sup/sat", () => {
  it.each(cmCases)("sup (sätteri): $name", ({ input, expected }) => {
    expect(render(input, false)).toBe(expected);
  });

  it.each(gfmCases)("sup (sätteri) gfm: $name", ({ input, expected }) => {
    expect(render(input, true)).toBe(expected);
  });

  it.each(crossNodeCases)(
    "sup (sätteri) cross-node: $name",
    ({ input, expected }) => {
      expect(render(input, false)).toBe(expected);
    }
  );
});
