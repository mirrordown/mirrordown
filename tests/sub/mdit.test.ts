import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { sub } from "../../packages/mdit-sub/src";
import { sup } from "../../packages/mdit-sup/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

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

const subSupCases = parseFixture(
  read("fixtures/sub-sup.md"),
  read("expected/sub-sup.html")
);

const md = new MarkdownIt().use(sub);
// markdown-it's counterpart of remark and Sätteri without GFM: with strikethrough off, the plugin's own rule sees the `~~` runs.
const mdPlain = new MarkdownIt().disable("strikethrough").use(sub);
// Both registration orders: which plugin is added first must not change how crossing runs pair.
const subSupOrders = [
  ["sub, sup", new MarkdownIt().use(sub).use(sup)],
  ["sup, sub", new MarkdownIt().use(sup).use(sub)]
] as const;
const mdGfm = new MarkdownIt({
  html: false,
  linkify: false,
  typographer: false
})
  .enable("table")
  .use(sub);

describe("sub/mdit", () => {
  it.each(cmCases)("sub (markdown-it): $name", ({ input, expected }) => {
    expect(normalizeHtml(md.render(input))).toBe(expected);
  });

  it.each(cmCases)(
    "sub (markdown-it) without strikethrough: $name",
    ({ input, expected }) => {
      expect(normalizeHtml(mdPlain.render(input))).toBe(expected);
    }
  );

  it.each(gfmCases)("sub (markdown-it) gfm: $name", ({ input, expected }) => {
    expect(normalizeHtml(mdGfm.render(input))).toBe(expected);
  });

  // Letting a `*` run flank a tilde is GFM's rule, not CommonMark's: remark and Sätteri without GFM leave these asterisks literal, so markdown-it must too once strikethrough (its GFM) is off, whether that happened before or after the plugin was added.
  it("leaves asterisks beside a subscript inside a word literal while strikethrough is off", () => {
    expect(normalizeHtml(mdPlain.render("x*~i~*"))).toBe(
      "<p>x*<sub>i</sub>*</p>"
    );
    const disabledLater = new MarkdownIt().use(sub).disable("strikethrough");
    expect(normalizeHtml(disabledLater.render("H**~2~**O"))).toBe(
      "<p>H**<sub>2</sub>**O</p>"
    );
  });

  // Crossing spans are malformed, and each engine resolves them its own way: markdown-it pairs whichever closer comes first, while remark and Sätteri (see their tests) let the construct that appeared first in the paragraph win. Pinned so that a change in either is noticed.
  it.each([
    ["*x* ~a *b~ c*", "<p><em>x</em> <sub>a *b</sub> c*</p>"],
    ["~x~ *a ~b* c~", "<p><sub>x</sub> <em>a ~b</em> c~</p>"]
  ])(
    "closes the first closer when a subscript crosses emphasis: %s",
    (input, expected) => {
      expect(normalizeHtml(md.render(input))).toBe(expected);
    }
  );

  describe.each(subSupOrders)("with sup (%s)", (_, mdBoth) => {
    it.each(subSupCases)(
      "sub (markdown-it) with sup: $name",
      ({ input, expected }) => {
        expect(normalizeHtml(mdBoth.render(input))).toBe(expected);
      }
    );
  });

  it.each(crossNodeCases)(
    "sub (markdown-it) cross-node: $name",
    ({ input, expected }) => {
      expect(normalizeHtml(md.render(input))).toBe(expected);
    }
  );
});
