import { describe, expect, it } from "vite-plus/test";
import {
  codePointBefore,
  isCjkAmbiguousPunctuationSequence,
  isCjkCharacter,
  isEastAsianWide,
  isHangul,
  isIdeographicVariationSelector,
  isNonEmojiVariationSelector
} from "../../packages/core/src";

const at = (character: string): number => character.codePointAt(0)!;

// The CJK-friendly emphasis rule lets `**` open and close beside a CJK character where CommonMark would not, and the line-break rule joins lines between wide characters. Who counts decides whether `**テスト。**テスト` is bold and whether a line break shows as a space, so each kind of character is pinned here with the reason it is in or out.
describe("core: isCjkCharacter", () => {
  it.each([
    [`an ideograph`, `字`],
    [`hiragana`, `あ`],
    [`katakana`, `カ`],
    [`a fullwidth Latin letter, East Asian Width F`, `Ａ`],
    [`halfwidth katakana, East Asian Width H`, `ｱ`],
    [`CJK punctuation`, `。`],
    [`a CJK bracket`, `「`],
    [`an ideograph outside the Basic Multilingual Plane`, `𠮷`]
  ])("counts %s, which is wide", (_, character) => {
    expect(isCjkCharacter(at(character))).toBe(true);
  });

  it.each([
    [`a Hangul syllable`, `한`],
    [`a leading jamo, which is wide`, `ᄀ`],
    [`halfwidth Hangul`, `ﾡ`]
  ])("counts %s", (_, character) => {
    expect(isCjkCharacter(at(character))).toBe(true);
  });

  it("counts Hangul jamo that are not wide, because the definition takes all of the Hangul script", () => {
    // U+1161 HANGUL JUNGSEONG A has East Asian Width N: a vowel that joins a syllable, never shown alone.
    expect(isEastAsianWide(0x1161)).toBe(false);
    expect(isHangul(0x1161)).toBe(true);
    expect(isCjkCharacter(0x1161)).toBe(true);
  });

  it("does not count an emoji, though it is wide", () => {
    // Emoji are wide so that they get a full cell, but they are not text in a CJK script: `🎉**x**` must not change how `**` reads.
    expect(isEastAsianWide(at(`🎉`))).toBe(true);
    expect(isCjkCharacter(at(`🎉`))).toBe(false);
  });

  it.each([
    [`a wavy dash`, `〰`],
    [`a part alternation mark`, `〽`],
    [`a circled ideograph`, `㊗`],
    [`a squared katakana`, `🈂`],
    [`a squared ideograph`, `🈷`]
  ])(
    "counts %s, which has an emoji form but shows as text by default",
    (_, character) => {
      // The specification's own examples: only Emoji_Presentation, emoji by default, takes a character out. These are emoji only when U+FE0F follows.
      expect(isCjkCharacter(at(character))).toBe(true);
    }
  );

  it.each([
    [`a Latin letter`, `a`],
    [`a digit`, `1`],
    [`an ASCII asterisk`, `*`]
  ])("does not count %s", (_, character) => {
    expect(isCjkCharacter(at(character))).toBe(false);
  });

  it.each([
    [`a curly quotation mark`, `“`],
    [`a plus-minus sign`, `±`]
  ])(
    "does not count %s, whose East Asian Width is A, ambiguous",
    (_, character) => {
      // Ambiguous characters are narrow in Western text and wide in East Asian fonts. The specification leaves them out; a variation selector can ask for the fullwidth form (see isCjkAmbiguousPunctuationSequence).
      expect(isEastAsianWide(at(character))).toBe(false);
      expect(isCjkCharacter(at(character))).toBe(false);
    }
  );

  it("counts the ideographic space, so a caller must test for whitespace first", () => {
    // U+3000 is fullwidth, and the definition has no exception for it. The flanking rule asks about whitespace before it asks about CJK characters, so the order is the caller's.
    expect(isCjkCharacter(0x3000)).toBe(true);
  });

  it("does not count either half of a surrogate pair, so the pair must be read as one code point", () => {
    // `𠮷` is two UTF-16 code units, and neither alone is a character.
    expect(isCjkCharacter(`𠮷`.charCodeAt(0))).toBe(false);
    expect(isCjkCharacter(`𠮷`.charCodeAt(1))).toBe(false);
  });

  it("counts an unassigned code point in an ideograph block, which Unicode reserves for ideographs", () => {
    // U+2A6E0 is reserved in CJK Unified Ideographs Extension B; EastAsianWidth.txt gives such code points W, so an ideograph added there later is already a CJK character.
    expect(isCjkCharacter(0x2a6e0)).toBe(true);
  });
});

describe("core: isEastAsianWide", () => {
  it.each([
    [`an ideograph`, `字`],
    [`a fullwidth letter`, `Ａ`],
    [`halfwidth katakana`, `ｱ`],
    [`an emoji`, `🎉`],
    [`a Hangul syllable`, `한`]
  ])("is true for %s", (_, character) => {
    // The line-break rule reads East Asian Width alone, emoji included, as CSS Text does.
    expect(isEastAsianWide(at(character))).toBe(true);
  });

  it.each([
    [`a Latin letter`, `a`],
    [`a curly quotation mark, ambiguous`, `“`],
    [`a space`, ` `]
  ])("is false for %s", (_, character) => {
    expect(isEastAsianWide(at(character))).toBe(false);
  });
});

describe("core: isHangul", () => {
  it.each([
    [`a syllable`, `한`],
    [`a compatibility jamo`, `ㄱ`],
    [`halfwidth Hangul`, `ﾡ`]
  ])("is true for %s", (_, character) => {
    // Korean puts spaces between words, so the line-break rule keeps a break beside Hangul, wide or not.
    expect(isHangul(at(character))).toBe(true);
  });

  it.each([
    [`an ideograph`, `字`],
    [`hiragana`, `あ`],
    [`a Latin letter`, `a`]
  ])("is false for %s", (_, character) => {
    expect(isHangul(at(character))).toBe(false);
  });
});

describe("core: variation selectors", () => {
  it("knows the ideographic variation selectors, U+E0100 to U+E01EF", () => {
    // An ideographic variation sequence: the selector picks one glyph of the ideograph before it, so the emphasis rule reads a delimiter after the selector as one after the ideograph.
    expect(isIdeographicVariationSelector(`葛\u{e0100}`.codePointAt(1)!)).toBe(
      true
    );
    expect(isIdeographicVariationSelector(0xe0100)).toBe(true);
    expect(isIdeographicVariationSelector(0xe01ef)).toBe(true);
    expect(isIdeographicVariationSelector(0xe00ff)).toBe(false);
    expect(isIdeographicVariationSelector(0xe01f0)).toBe(false);
  });

  it("knows the non-emoji general-use variation selectors, U+FE00 to U+FE0E", () => {
    expect(isNonEmojiVariationSelector(0xfe00)).toBe(true);
    expect(isNonEmojiVariationSelector(0xfe0e)).toBe(true);
    expect(isNonEmojiVariationSelector(0xfdff)).toBe(false);
  });

  it("does not count U+FE0F, which asks for emoji presentation", () => {
    // A character followed by U+FE0F shows as an emoji, so the specification does not look past U+FE0F to the character before it.
    expect(isNonEmojiVariationSelector(0xfe0f)).toBe(false);
  });
});

describe("core: isCjkAmbiguousPunctuationSequence", () => {
  it.each([
    [`a left single quotation mark`, `‘`],
    [`a right single quotation mark`, `’`],
    [`a left double quotation mark`, `“`],
    [`a right double quotation mark`, `”`]
  ])(
    "is true for %s with U+FE01, which asks for its fullwidth form",
    (_, character) => {
      // `他说**“你好”**然后走了`: in Chinese text these quotation marks are fullwidth, and U+FE01 is how a document says so.
      expect(isCjkAmbiguousPunctuationSequence(at(character), 0xfe01)).toBe(
        true
      );
    }
  );

  it("is false for the same mark with U+FE00, which asks for the non-fullwidth form", () => {
    expect(isCjkAmbiguousPunctuationSequence(at(`“`), 0xfe00)).toBe(false);
  });

  it("is false for punctuation that is a CJK character already", () => {
    // `「` is wide on its own; the sequence only matters for ambiguous punctuation.
    expect(isCjkAmbiguousPunctuationSequence(at(`「`), 0xfe01)).toBe(false);
  });

  it("is false for an ambiguous character that is not punctuation", () => {
    expect(isCjkAmbiguousPunctuationSequence(at(`±`), 0xfe01)).toBe(false);
  });
});

describe("core: codePointBefore", () => {
  it("reads the character before an index", () => {
    expect(codePointBefore(`a字`, 2)).toBe(at(`字`));
  });

  it("reads a surrogate pair as one code point, as codePointAt does after an index", () => {
    // `𠮷` takes two code units: index 2 is after it, and reading only the code unit before would give half a character.
    expect(codePointBefore(`𠮷*`, 2)).toBe(0x20bb7);
    expect(`*𠮷`.codePointAt(1)).toBe(0x20bb7);
  });

  it("reads the first half of a pair alone when the index splits the pair", () => {
    expect(codePointBefore(`𠮷`, 1)).toBe(`𠮷`.charCodeAt(0));
  });

  it("reads a lone surrogate as itself", () => {
    expect(codePointBefore(`a\udfb7`, 2)).toBe(0xdfb7);
    expect(codePointBefore(`\ud842a`, 1)).toBe(0xd842);
  });

  it("gives undefined at the start of the text and past its end", () => {
    // As codePointAt gives undefined past the end: the caller decides what the edge of the text counts as (the flanking rule counts it as whitespace).
    expect(codePointBefore(`a`, 0)).toBeUndefined();
    expect(codePointBefore(``, 0)).toBeUndefined();
    expect(codePointBefore(`a`, 2)).toBeUndefined();
  });
});
