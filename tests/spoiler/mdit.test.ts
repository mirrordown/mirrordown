import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import MarkdownIt from "markdown-it";
import { spoiler } from "../../packages/mdit-spoiler/src";
import { normalizeHtml, parseFixture } from "../utils/index.js";

const dir = import.meta.dirname;
const read = (path: string) => readFileSync(join(dir, path), "utf8");

const cmCases = parseFixture(
  read("fixtures/spoiler-commonmark.md"),
  read("expected/spoiler-commonmark.html")
);

const gfmCases = parseFixture(
  read("fixtures/spoiler-gfm.md"),
  read("expected/spoiler-gfm.html")
);

const md = new MarkdownIt().use(spoiler);

describe("spoiler/mdit", () => {
  it.each(cmCases)("spoiler (markdown-it): $name", ({ input, expected }) => {
    expect(normalizeHtml(md.render(input))).toBe(expected);
  });

  it.each(gfmCases)(
    "spoiler (markdown-it) gfm: $name",
    ({ input, expected }) => {
      expect(normalizeHtml(md.render(input))).toBe(expected);
    }
  );
});

// markdown-it's `text` rule does not stop at `|`, so the plugin replaces it with a copy whose terminator list is markdown-it's plus `|`. The list is copied by hand. If markdown-it changes its own list, enabling spoiler would silently change where every text run breaks, and a rule keyed on the new character would stop firing. A probe rule placed straight after `text` runs exactly where `text` declined, which shows each implementation's terminators without reaching into either.
describe("spoiler/mdit: the replaced text rule stops where markdown-it's own does, plus `|`", () => {
  const stops = (instance: MarkdownIt, src: string): number[] => {
    const seen = new Set<number>();
    instance.inline.ruler.after("text", "probe", (state) => {
      seen.add(state.pos);
      return false;
    });
    instance.parseInline(src, {});
    return [...seen].toSorted((a, b) => a - b);
  };
  // Every ASCII character, each between two letters, plus a line ending.
  const ascii = Array.from({ length: 0x7f }, (_, code) =>
    String.fromCharCode(code + 1)
  );

  it("agrees with the built-in rule on every ASCII character but the pipe", () => {
    const differing = ascii.filter(
      (char) =>
        char !== "|" &&
        stops(new MarkdownIt(), `a${char}b`).join() !==
          stops(new MarkdownIt().use(spoiler), `a${char}b`).join()
    );
    expect(differing).toEqual([]);
  });

  it("stops at a pipe, which the built-in rule runs through", () => {
    expect(stops(new MarkdownIt(), "a|b")).toEqual([]);
    expect(stops(new MarkdownIt().use(spoiler), "a|b")).toEqual([1]);
  });
});
