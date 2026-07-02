import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it, describe } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { squeezeParagraphs } from "../../packages/mdit-squeeze-paragraphs/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cases = parseFixture(
  read("fixtures/squeeze-paragraphs.md"),
  read("expected/squeeze-paragraphs.html")
);

const md = new MarkdownIt().use(squeezeParagraphs);
const render = (src: string) => normalizeHtml(md.render(src));

describe("squeeze-paragraphs (markdown-it)", () => {
  it.each(cases)(
    "squeeze-paragraphs (markdown-it): $name",
    ({ input, expected }) => {
      expect(render(input)).toBe(expected);
    }
  );
});

// A prior core rule that empties every paragraph's inline content, leaving
// residue for squeeze to remove. Raw markdown never produces an empty
// paragraph, so removal can only be exercised through such an interaction.
const withResidue = new MarkdownIt().use(squeezeParagraphs);
withResidue.core.ruler.before("squeeze_paragraphs", "empty_out", (state) => {
  // Empty only paragraph inline tokens (mirrors the rehype helper touching only
  // <p>), leaving headings and other blocks intact.
  const tokens = state.tokens;
  for (let i = 0; i < tokens.length; i++) {
    const inline = tokens[i];
    if (inline?.type === "inline" && tokens[i - 1]?.type === "paragraph_open") {
      inline.content = "";
      inline.children = [];
    }
  }
});
const renderResidue = (src: string) => normalizeHtml(withResidue.render(src));

describe("squeeze-paragraphs (markdown-it): removes residue", () => {
  it("drops paragraphs emptied by a prior rule", () => {
    expect(renderResidue("first\n\nsecond")).toBe("");
  });

  it("leaves surrounding content when only paragraphs are emptied", () => {
    expect(renderResidue("# Kept\n\nremoved")).toBe("<h1>Kept</h1>");
  });
});
