import { describe, expect, it } from "vite-plus/test";
import { SPEC, SPEC_GFM, cases } from "./cases.js";
import { asDel, markdownIt } from "./engines.js";

describe("cjk-friendly/mdit", () => {
  // The rule does not depend on GFM, so the CommonMark cases hold with strikethrough on and off.
  const commonMark = markdownIt({ gfm: false });
  const gfm = markdownIt();
  // The corpus is about emphasis and strikethrough alone, so its expected HTML was made without Mirrordown's delimiter sets (`~one~` stays text).
  const corpus = markdownIt({ spans: false });

  it.each(cases(`cjk-friendly`))("$name", ({ input, expected }) => {
    expect(commonMark(input)).toBe(expected);
    expect(asDel(gfm(input))).toBe(expected);
  });

  it.each(cases(`cjk-friendly-gfm`))("gfm: $name", ({ input, expected }) => {
    expect(asDel(gfm(input))).toBe(expected);
  });

  it.each([...SPEC, ...SPEC_GFM].flatMap(cases))(
    "corpus: $name",
    ({ input, expected }) => {
      expect(asDel(corpus(input))).toBe(expected);
    }
  );

  // The corpus cases the two engines render differently without the plugin too: astral punctuation, markdown-it's runs of three or more tildes, and GFM's bare URLs, which this markdown-it has none of.
  it.each(cases(`spec-mdit`))(
    "corpus, markdown-it's own: $name",
    ({ input, expected }) => {
      expect(corpus(input)).toBe(expected);
    }
  );

  // markdown-it reads `🎉` as one character, a symbol (So), so it is punctuation beside a run, as CommonMark says; remark reads its two surrogates, neither of them punctuation. The amendment keeps each engine's answer: `**` after a letter and before `🎉` does not open here.
  it("reads an astral symbol beside a run as punctuation", () => {
    expect(corpus(`a**🎉a**a`)).toBe(`<p>a**🎉a**a</p>`);
  });
});
