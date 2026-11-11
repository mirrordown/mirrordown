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

// The canonical sub/sup interplay (nesting, crossing runs) comes from Sätteri; markdown-it and remark are held to it.
const subSupCases = parseFixture(
  read("fixtures/sub-sup.md"),
  read("expected/sub-sup.html")
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

  // Letting a `*` run flank a tilde is part of Sätteri's GFM; without it the asterisks are literal, and markdown-it follows that when its strikethrough is off.
  it("leaves asterisks beside a subscript inside a word literal without GFM", () => {
    expect(render("x*~i~*", false)).toBe("<p>x*<sub>i</sub>*</p>");
  });

  // Crossing spans are malformed, and each engine resolves them its own way: here the construct that appeared first in the paragraph claims its pair, as in remark, while markdown-it (see its test) pairs whichever closer comes first. Pinned so that a change in either is noticed.
  it.each([
    ["*x* ~a *b~ c*", "<p><em>x</em> ~a <em>b~ c</em></p>"],
    ["~x~ *a ~b* c~", "<p><sub>x</sub> *a <sub>b* c</sub></p>"]
  ])(
    "lets the construct seen first win when a subscript crosses emphasis: %s",
    (input, expected) => {
      expect(render(input, false)).toBe(expected);
    }
  );

  // An engine limit: with GFM off, markdown-it and remark read a `~~` run as plain text and render `<p>~~H<sub>2</sub>O~~</p>`, but Sätteri keeps a matched `~~…~~` pair closed to subscripts. Pinned so that a change in Sätteri is noticed.
  it.each([
    ["~~H~2~O~~", "<p>~~H~2~O~~</p>"],
    ["~~a ~b~ c~~", "<p>~~a ~b~ c~~</p>"]
  ])(
    "finds no subscript inside a `~~…~~` pair with GFM off: %s",
    (input, expected) => {
      expect(render(input, false)).toBe(expected);
    }
  );

  it.each(subSupCases)(
    "sub (sätteri) with sup: $name",
    ({ input, expected }) => {
      expect(
        normalizeHtml(
          markdownToHtml(input, {
            features: {
              gfm: false,
              subscript: true,
              superscript: true,
              frontmatter: false,
              smartPunctuation: false
            }
          }).html
        )
      ).toBe(expected);
    }
  );

  it.each(crossNodeCases)(
    "sub (sätteri) cross-node: $name",
    ({ input, expected }) => {
      expect(render(input, false)).toBe(expected);
    }
  );
});
