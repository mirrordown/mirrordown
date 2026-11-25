import { describe, expect, it } from "vite-plus/test";
import { comparable } from "../utils/hostile.js";
import { asDel, markdownIt, remark } from "./engines.js";
import { ALPHABET, SPAN_ALPHABET, generate } from "./generate.js";

// Our markdown-it against our remark on generated strings, with and without GFM, with Mirrordown's delimiter sets in both. A string the two engines render differently without the plugin is set aside: that difference is theirs. Every other string must render alike with it, but for the differences pinned below, each of which the engines show without CJK text too.

const ASTRAL_PUNCTUATION = /^[\p{P}\p{S}]$/u;
const isAstralPunctuation = (character: string): boolean =>
  character.codePointAt(0)! > 0xffff && ASTRAL_PUNCTUATION.test(character);

describe.each([
  { alphabet: `the reference alphabet`, letters: ALPHABET },
  { alphabet: `Mirrordown's delimiters added`, letters: SPAN_ALPHABET }
])("cjk-friendly parity, $alphabet", ({ letters }) => {
  describe.each([true, false])("with GFM %s", (gfm) => {
    const md = markdownIt({ gfm });
    const rm = remark({ gfm });
    const mdOff = markdownIt({ gfm, cjk: false });
    const rmOff = remark({ gfm, cjk: false });
    const strings = generate(4000, letters);
    const compared = strings.filter(
      (input) => asDel(mdOff(input)) === rmOff(input)
    );
    const differ = compared.filter((input) => asDel(md(input)) !== rm(input));

    it("compares most strings, and the plugin changes some of them", () => {
      expect(compared.length).toBeGreaterThan(strings.length * 0.98);
      expect(
        compared.filter((input) => rm(input) !== rmOff(input)).length
      ).toBeGreaterThan(50);
    });

    // markdown-it reads `🎉` whole, a symbol and so punctuation; micromark reads two code units, neither punctuation. Here the amendment's clauses turn on what the two read beside a run: taken for a letter, markdown-it renders what remark does.
    it("renders alike, but where an astral symbol is punctuation to markdown-it only", () => {
      const astral = differ.filter((input) =>
        Array.from(input).some(isAstralPunctuation)
      );
      const asLetters = (text: string): string =>
        Array.from(text, (c) => (isAstralPunctuation(c) ? `ß` : c)).join(``);
      for (const input of astral) {
        expect(asDel(md(asLetters(input)))).toBe(asLetters(rm(input)));
      }
      expect(differ.filter((input) => !astral.includes(input))).toStrictEqual(
        letters === SPAN_ALPHABET
          ? [`Ａ--.あ^~++--~`, `)Ａ++））(_++_`, `||字~_Ａ--(==||~`]
          : []
      );
    });
  });
});

// The three strings pinned above, with the CJK text that lets a run flank replaced by a space or a letter, and no plugin: the engines differ there already. remark builds `==`, `++`, `--` and `||` after micromark has paired `~` and `_`, so a span of ours cannot cross one of micromark's, while markdown-it pairs all of them in one list.
describe("cjk-friendly parity: spans that cross a micromark construct", () => {
  const md = markdownIt({ cjk: false });
  const rm = remark({ cjk: false });
  it.each([` --.a^~++--~`, `) ++))(_++_`, `||a ~_A--(==||~`])(
    "differ without the plugin: %s",
    (input) => {
      expect(asDel(md(input))).not.toBe(rm(input));
    }
  );
});

// markdown-it turns every line ending into `\n`, remark keeps `\r`; neither is the plugin's.
describe("cjk-friendly parity: line endings", () => {
  it.each([`\r\n`, `\r`])("reads %j as a line ending", (ending) => {
    const input = `**テスト。**テスト${ending}==次。==です${ending}${ending}~~削除。~~テスト`;
    const html = remark()(input);
    expect(html).toContain(`<strong>テスト。</strong>`);
    expect(html).toContain(`<mark>次。</mark>`);
    expect(html).toContain(`<del>削除。</del>`);
    expect(comparable(asDel(markdownIt()(input)))).toBe(comparable(html));
  });
});
