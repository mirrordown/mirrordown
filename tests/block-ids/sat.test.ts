import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { markdownToHtml } from "satteri";
import { satteriBlockIds } from "../../packages/sat-block-ids/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cmCases = parseFixture(
  read("fixtures/block-ids-commonmark.md"),
  read("expected/block-ids-commonmark.html")
);
const gfmCases = parseFixture(
  read("fixtures/block-ids-gfm.md"),
  read("expected/block-ids-gfm.html")
);
const extensionCases = parseFixture(
  read("fixtures/block-ids-extensions-gfm.md"),
  read("expected/block-ids-extensions-gfm.html")
);

const render = (input: string, gfm: boolean): string =>
  normalizeHtml(
    markdownToHtml(input, {
      features: { gfm, frontmatter: false, smartPunctuation: false },
      mdastPlugins: [satteriBlockIds()]
    }).html
  );

describe("block-ids/sat", () => {
  it.each(cmCases)("block-ids (sätteri): $name", ({ input, expected }) => {
    expect(render(input, false)).toBe(expected);
  });

  it.each(gfmCases)("block-ids (sätteri) gfm: $name", ({ input, expected }) => {
    expect(render(input, true)).toBe(expected);
  });

  // markdown-it has no footnotes, task lists or bare-URL links of its own, so these cases are shared with remark only.
  it.each(extensionCases)(
    "block-ids (sätteri) gfm extensions: $name",
    ({ input, expected }) => {
      expect(render(input, true)).toBe(expected);
    }
  );
});
