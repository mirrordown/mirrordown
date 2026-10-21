import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { markdownToHtml, type Features } from "satteri";
import { satteriRuby } from "../../packages/sat-ruby/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cmCases = parseFixture(
  read("fixtures/ruby-commonmark.md"),
  read("expected/ruby-commonmark.html")
);

const gfmCases = parseFixture(
  read("fixtures/ruby-gfm.md"),
  read("expected/ruby-gfm.html")
);

// GFM strikethrough renders as `<del>` in remark and Sätteri (markdown-it's is `<s>`), so the remark-specific expectations hold here too.
const strikethroughCases = parseFixture(
  read("fixtures/ruby-remd.md"),
  read("expected/ruby-remd.html")
);

const htmlCases = parseFixture(
  read("fixtures/ruby-html.md"),
  read("expected/ruby-html.html")
);

// The plugin re-parses with the features it is given, so it gets the document's own.
const render = (input: string, gfm: boolean): string => {
  const features: Features = {
    gfm,
    frontmatter: false,
    smartPunctuation: false
  };
  return normalizeHtml(
    markdownToHtml(input, {
      features,
      mdastPlugins: [satteriRuby({ features })]
    }).html
  );
};

describe("ruby/sat", () => {
  it.each(cmCases)("ruby (sätteri): $name", ({ input, expected }) => {
    expect(render(input, false)).toBe(expected);
  });

  it.each(gfmCases)("ruby (sätteri) gfm: $name", ({ input, expected }) => {
    expect(render(input, true)).toBe(expected);
  });

  it.each(strikethroughCases)(
    "ruby (sätteri) strikethrough: $name",
    ({ input, expected }) => {
      expect(render(input, true)).toBe(expected);
    }
  );

  it.each(htmlCases)("ruby (sätteri) html: $name", ({ input, expected }) => {
    expect(render(input, false)).toBe(expected);
  });
});
