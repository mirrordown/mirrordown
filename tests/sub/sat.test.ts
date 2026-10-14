import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { markdownToHtml } from "satteri";
import { normalizeHtml, parseFixture } from "../utils/index.js";

// Sätteri parses `~sub~` natively, so there is no sat-sub package: these fixtures check that its `subscript` feature renders what the markdown-it and remark plugins do.

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cmCases = parseFixture(
  read("fixtures/sub-commonmark.md"),
  read("expected/sub-commonmark.html")
);

const gfmCases = parseFixture(
  read("fixtures/sub-gfm.md"),
  read("expected/sub-gfm.html")
);

const crossNodeCases = parseFixture(
  read("fixtures/sub-cross-node.md"),
  read("expected/sub-cross-node.html")
);

const render = (input: string, gfm: boolean): string =>
  normalizeHtml(
    markdownToHtml(input, {
      features: {
        gfm,
        subscript: true,
        frontmatter: false,
        smartPunctuation: false
      }
    }).html
  );

describe("sub/sat", () => {
  it.each(cmCases)("sub (sätteri): $name", ({ input, expected }) => {
    expect(render(input, false)).toBe(expected);
  });

  it.each(gfmCases)("sub (sätteri) gfm: $name", ({ input, expected }) => {
    expect(render(input, true)).toBe(expected);
  });

  it.each(crossNodeCases)(
    "sub (sätteri) cross-node: $name",
    ({ input, expected }) => {
      expect(render(input, false)).toBe(expected);
    }
  );
});
