import { describe, expect, it } from "vite-plus/test";
import { delimiterFlanking, type Neighbour } from "../../packages/core/src";

// A neighbour as markdown-it classifies one: its whitespace list, and Unicode P and S on the whole character. The engines pass their own answers; this stands in for one of them.
const WHITESPACE = /^[\t\n\v\f\r    -   　]$/u;
const PUNCTUATION = /^[\p{P}\p{S}]$/u;
const neighbour = (character: string | undefined): Neighbour =>
  character === undefined
    ? { kind: `whitespace` }
    : {
        kind: WHITESPACE.test(character)
          ? `whitespace`
          : PUNCTUATION.test(character)
            ? `punctuation`
            : `other`,
        codePoint: character.codePointAt(0)
      };

// The run between `before` and `after`, each written as the text on that side of it: the last character of `before` (and the one before it, for a variation selector) and the first of `after`.
const flanking = (before: string, after: string, cjkFriendly = true) => {
  const characters = [...before];
  return delimiterFlanking(
    neighbour(characters.at(-1)),
    neighbour([...after][0]),
    cjkFriendly,
    () => neighbour(characters.at(-2))
  );
};

// CommonMark first: with the amendment off, the function is CommonMark's definition, which every delimiter in the suite classified by before the amendment existed.
describe("core: delimiterFlanking without the amendment", () => {
  it("does not open before whitespace, nor close after it", () => {
    expect(flanking(`a`, ` b`, false)).toMatchObject({
      left: false,
      right: true
    });
    expect(flanking(`a `, `b`, false)).toMatchObject({
      left: true,
      right: false
    });
  });

  // `a**"b"**`: a run between a letter and punctuation could be the end of a word, so it does not open.
  it("does not open before punctuation unless whitespace or punctuation precedes it", () => {
    expect(flanking(`a`, `"b`, false)).toMatchObject({
      left: false,
      right: true
    });
    expect(flanking(`(`, `"b`, false)).toMatchObject({
      left: true,
      right: true
    });
  });

  // `**テスト。**テスト`, the problem itself: the closer follows `。` and precedes a letter, so it does not close.
  it("does not close after CJK punctuation followed by a letter", () => {
    expect(flanking(`テスト。`, `テスト`, false)).toMatchObject({
      left: true,
      right: false
    });
  });
});

// Each clause of the amended definitions, with the example that needs it.
describe("core: delimiterFlanking with the amendment", () => {
  // Left (2a): "not followed by a non-CJK punctuation character". CJK punctuation after the run no longer stops it opening: `x**「重要」**`.
  it("opens before CJK punctuation after a letter", () => {
    expect(flanking(`x`, `「重要」`).left).toBe(true);
    expect(flanking(`x`, `「重要」`, false).left).toBe(false);
  });

  // Left (2bγ): "preceded by a CJK sequence". `他说**“你好”**`: `“` is not a CJK character (East Asian Width A), but the run follows `说`.
  it("opens before non-CJK punctuation after a CJK character", () => {
    expect(flanking(`他说`, `“你好”`).left).toBe(true);
    expect(flanking(`他说`, `“你好”`, false).left).toBe(false);
  });

  // Right (2a): "not preceded by a non-CJK punctuation sequence". `**テスト。**テスト` closes: `。` is CJK punctuation.
  it("closes after CJK punctuation before a letter", () => {
    expect(flanking(`テスト。`, `テスト`).right).toBe(true);
  });

  // Right (2bγ): "followed by a CJK character". `**이름(Name)**은`: the closer follows `)` and precedes a Hangul syllable.
  it("closes after non-CJK punctuation before a CJK character", () => {
    expect(flanking(`(Name)`, `은`).right).toBe(true);
    expect(flanking(`(Name)`, `은`, false).right).toBe(false);
  });

  // Left (2bδ): "preceded by an Ideographic Variation Selector". `葛󠄀` is an ideograph with a selector for its glyph; the run after it opens before `"` as it would after the ideograph alone.
  it("opens before punctuation after an ideographic variation selector", () => {
    expect(flanking(`葛\u{e0100}`, `"x"`).left).toBe(true);
    expect(flanking(`葛\u{e0100}`, `"x"`, false).left).toBe(false);
  });

  // The CJK sequence: a CJK character with a non-emoji variation selector is still that character. `。︀` (U+3002 U+FE00) before the closer is CJK punctuation.
  it("reads a CJK character through the variation selector after it", () => {
    expect(flanking(`テスト。︀`, `テスト`).right).toBe(true);
  });

  // The CJK ambiguous punctuation sequence: U+FE01 asks for the fullwidth form of `“ ” ‘ ’`, which then count as CJK punctuation. Alone they are not CJK.
  it("counts a quotation mark with U+FE01 as CJK punctuation, and without it as not", () => {
    expect(flanking(`”︁`, `a`).right).toBe(true);
    expect(flanking(`”`, `a`).right).toBe(false);
  });

  // The Unicode punctuation sequence: the amendment reads punctuation through a selector too, so `.︀` is punctuation before the run, where CommonMark reads the selector as a letter. This is the one change the amendment makes without a CJK character: `.︀**a` no longer closes.
  it("reads punctuation through the variation selector after it", () => {
    expect(flanking(`.︀`, `a`)).toMatchObject({
      right: false,
      punctuationBefore: true
    });
    expect(flanking(`.︀`, `a`, false)).toMatchObject({
      right: true,
      punctuationBefore: false
    });
  });

  // The specification leaves a selector after whitespace open. It stays what CommonMark reads before the run, a character that is neither whitespace nor punctuation, and it is not taken as part of the whitespace before it.
  it("leaves a variation selector after whitespace as the character before the run", () => {
    expect(flanking(` ︀`, `"x"`)).toStrictEqual(flanking(` ︀`, `"x"`, false));
    expect(flanking(`︀`, `"x"`)).toStrictEqual(flanking(`︀`, `"x"`, false));
  });

  // Whitespace is tested before CJK: U+3000 IDEOGRAPHIC SPACE is a CJK character by the definition (East Asian Width F), and beside a delimiter it is whitespace, as in CommonMark.
  it("treats the ideographic space as whitespace, not as a CJK character", () => {
    expect(flanking(`字`, `　字`)).toMatchObject({ left: false, right: true });
    expect(flanking(`字　`, `字`)).toMatchObject({ left: true, right: false });
  });

  // Emoji are wide but not CJK characters. An engine that reads `🎉` as neither whitespace nor punctuation (micromark sees two surrogates) gets no CJK clause from it.
  it("does not count an emoji as a CJK character", () => {
    const quote = neighbour(`"`);
    const emoji: Neighbour = { kind: `other`, codePoint: 0x1f389 };
    const ideograph: Neighbour = { kind: `other`, codePoint: 0x5b57 };
    expect(delimiterFlanking(quote, emoji, true).right).toBe(false);
    expect(delimiterFlanking(quote, ideograph, true).right).toBe(true);
  });

  // The character two back is read only for a variation selector, as the specification's tips ask: most runs never need it.
  it("reads the character before a variation selector, and only then", () => {
    let reads = 0;
    const read = (): Neighbour => {
      reads++;
      return neighbour(`。`);
    };
    delimiterFlanking(neighbour(`a`), neighbour(`"`), true, read);
    expect(reads).toBe(0);
    delimiterFlanking(neighbour(`︀`), neighbour(`"`), true, read);
    expect(reads).toBe(1);
  });

  // The amendment adds clauses and replaces none: without a CJK character, a selector or an ideographic selector beside the run, the answer is CommonMark's. This is what keeps documents without CJK text as they were.
  it.each([
    [`a`, `b`],
    [`a`, ` b`],
    [`a `, `b`],
    [`a`, `"b`],
    [`"`, `b`],
    [`(`, `"b`],
    [`🎉`, `"b`],
    [`é`, `!`],
    [`𝒳`, `.`]
  ])("answers as CommonMark between %j and %j", (before, after) => {
    expect(flanking(before, after)).toStrictEqual(
      flanking(before, after, false)
    );
  });
});
