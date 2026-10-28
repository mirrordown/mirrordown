import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { caption } from "../../packages/mdit-caption/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cmCases = parseFixture(
  read("fixtures/caption-commonmark.md"),
  read("expected/caption-commonmark.html")
);
const gfmCases = parseFixture(
  read("fixtures/caption-gfm.md"),
  read("expected/caption-gfm.html")
);

const md = new MarkdownIt().use(caption);

describe("caption/mdit", () => {
  it.each(cmCases)("caption (markdown-it): $name", ({ input, expected }) => {
    expect(normalizeHtml(md.render(input))).toBe(expected);
  });

  it.each(gfmCases)(
    "caption (markdown-it) gfm: $name",
    ({ input, expected }) => {
      expect(normalizeHtml(md.render(input))).toBe(expected);
    }
  );

  // markdown-it aligns a cell with a `style` attribute (remark writes `align`, so this isn't a shared fixture); it stays on the cell rather than moving to the figure with the caption's own attributes.
  it("keeps a table's alignment on its cells", () => {
    const html = normalizeHtml(md.render("| a |\n| -: |\n| 1 |\n~: Aligned"));
    expect(html).toContain('<td style="text-align:right">1</td>');
    expect(html).toContain('<figure class="markdown-caption">');
  });
});
