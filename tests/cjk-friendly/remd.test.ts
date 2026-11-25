import { describe, expect, it } from "vite-plus/test";
import { SPEC, SPEC_GFM, cases } from "./cases.js";
import { remark } from "./engines.js";

describe("cjk-friendly/remd", () => {
  // The rule does not depend on GFM, so the CommonMark cases hold with remark-gfm and without it.
  const commonMark = remark({ gfm: false });
  const gfm = remark();
  // The corpus is about emphasis and strikethrough alone, so its expected HTML was made without Mirrordown's delimiter sets (`~one~` stays text).
  const corpus = remark({ spans: false });

  it.each(cases(`cjk-friendly`))("$name", ({ input, expected }) => {
    expect(commonMark(input)).toBe(expected);
    expect(gfm(input)).toBe(expected);
  });

  it.each(cases(`cjk-friendly-gfm`))("gfm: $name", ({ input, expected }) => {
    expect(gfm(input)).toBe(expected);
  });

  it.each([...SPEC, ...SPEC_GFM].flatMap(cases))(
    "corpus: $name",
    ({ input, expected }) => {
      expect(corpus(input)).toBe(expected);
    }
  );

  // The corpus cases the two engines render differently without the plugin too: runs of three or more tildes, which GFM leaves as text, and GFM's bare URLs.
  it.each(cases(`spec-remd`))(
    "corpus, remark's own: $name",
    ({ input, expected }) => {
      expect(corpus(input)).toBe(expected);
    }
  );

  // Besides the specification's own change, the one thing the plugin changes in text without CJK characters: it reads a character outside the Basic Multilingual Plane beside a `*`, `_` or `~~` run whole, as CommonMark, markdown-it, Sätteri and remark-cjk-friendly do, so `🎉` (So) is punctuation and `**` between a letter and it does not open. micromark's own emphasis, which runs without the plugin, reads two code units there and takes it for a letter.
  it("reads an astral symbol beside a run whole, where micromark alone reads a letter", () => {
    expect(corpus(`a**🎉a**a`)).toBe(`<p>a**🎉a**a</p>`);
    expect(remark({ spans: false, cjk: false })(`a**🎉a**a`)).toBe(
      `<p>a<strong>🎉a</strong>a</p>`
    );
  });

  // A variation selector belongs to the character before it. micromark keeps a NUL (read as U+FFFD) apart from the text around it, so remark finds nothing before the selector and reads it as CommonMark does, a letter, and the run does not open before `"`; markdown-it reads U+FFFD there (as remark-cjk-friendly and markdown-it-cjk-friendly differ in the same way).
  it("reads a variation selector after a NUL as following nothing", () => {
    expect(corpus(`a\0︀**"b"**`)).toBe(`<p>a�︀**"b"**</p>`);
  });
});
