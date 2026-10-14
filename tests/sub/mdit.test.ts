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

  it.each(gfmCases)("sub (markdown-it) gfm: $name", ({ input, expected }) => {
    expect(normalizeHtml(mdGfm.render(input))).toBe(expected);
  });

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
