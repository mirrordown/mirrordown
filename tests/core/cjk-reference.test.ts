import { describe, expect, it } from "vite-plus/test";
import {
  classifyCharacter,
  classifyPrecedingCharacter,
  constantsEx,
  isCjk,
  isIvs,
  isNonEmojiGeneralUseVS
} from "micromark-extension-cjk-friendly-util";
import {
  isCjkAmbiguousPunctuationSequence,
  isCjkCharacter,
  isEastAsianWide,
  isIdeographicVariationSelector,
  isNonEmojiVariationSelector
} from "../../packages/core/src";

// micromark-extension-cjk-friendly-util is the specification author's own implementation, the one remark-cjk-friendly uses. Ours must give its answers on every code point, so that plugins built on ours behave as the ones built on it. It is a test-only dependency: it answers with the Unicode version of the runtime, which core must not.

type Category = ReturnType<typeof classifyCharacter>;

const LAST_CODE_POINT = 0x10ffff;

// The reference's class of every code point, computed once: it is the slow side.
const REFERENCE = Int32Array.from({ length: LAST_CODE_POINT + 1 }, (_, cp) =>
  classifyCharacter(cp)
);
const referenceClass = (cp: number): Category => REFERENCE[cp] as Category;

// The reference reads Emoji_Presentation with the runtime's `\p{…}`, which cannot know an emoji newer than the Unicode version of the Node running the tests, while its East Asian Width (get-east-asian-width 1.7.0) is Unicode 18's. So it calls such an emoji a CJK character, and on those code points the comparison says nothing about ours.
const UNKNOWN_TO_RUNTIME = /^\p{Cn}$/u;

// Every code point where our answer and the reference's differ, split by whether the runtime's Unicode assigns it.
const differences = (
  ours: (cp: number) => boolean,
  reference: (category: Category) => boolean
): { known: number[]; unknownToRuntime: number[] } => {
  const known: number[] = [];
  const unknownToRuntime: number[] = [];
  for (let cp = 0; cp <= LAST_CODE_POINT; cp++) {
    if (ours(cp) !== reference(referenceClass(cp))) {
      if (UNKNOWN_TO_RUNTIME.test(String.fromCodePoint(cp))) {
        unknownToRuntime.push(cp);
      } else {
        known.push(cp);
      }
    }
  }
  return { known, unknownToRuntime };
};

const SELECTORS = Array.from(
  { length: 16 },
  (_, index): [name: string, selector: number] => [
    `U+${(0xfe00 + index).toString(16).toUpperCase()}`,
    0xfe00 + index
  ]
);

describe("core: CJK tables against micromark-extension-cjk-friendly-util, on every code point", () => {
  it("agree on CJK characters, but for the ideographic space, which the reference reads as whitespace first", () => {
    // The reference gives each code point one class for the flanking rule, and whitespace wins. U+3000 is fullwidth, so by the definition it is a CJK character; the flanking rule never asks, because it tests for whitespace first (see cjk.test.ts).
    expect(differences(isCjkCharacter, isCjk).known).toEqual([0x3000]);
  });

  it("differ elsewhere only on wide emoji newer than the runtime's Unicode, which ours knows are emoji", () => {
    const { unknownToRuntime } = differences(isCjkCharacter, isCjk);
    expect(
      unknownToRuntime.filter(
        (cp) => !isEastAsianWide(cp) || isCjkCharacter(cp)
      )
    ).toEqual([]);
  });

  it("agree on ideographic variation selectors", () => {
    const { known, unknownToRuntime } = differences(
      isIdeographicVariationSelector,
      isIvs
    );
    expect([...known, ...unknownToRuntime]).toEqual([]);
  });

  it("agree on non-emoji general-use variation selectors", () => {
    const { known, unknownToRuntime } = differences(
      isNonEmojiVariationSelector,
      isNonEmojiGeneralUseVS
    );
    expect([...known, ...unknownToRuntime]).toEqual([]);
  });

  // The reference answers this inside classifyPrecedingCharacter: a pair is an ambiguous punctuation sequence when the selector makes it CJK punctuation though its first character alone is not.
  it.each(SELECTORS)(
    "agree on CJK ambiguous punctuation sequences ending in %s",
    (_, selector) => {
      const before = classifyCharacter(selector);
      const differing: number[] = [];
      for (let cp = 0; cp <= LAST_CODE_POINT; cp++) {
        const reference =
          classifyPrecedingCharacter(before, () => cp, selector) ===
            constantsEx.cjkPunctuation &&
          referenceClass(cp) !== constantsEx.cjkPunctuation;
        if (reference !== isCjkAmbiguousPunctuationSequence(cp, selector)) {
          differing.push(cp);
        }
      }
      expect(differing).toEqual([]);
    }
  );
});
