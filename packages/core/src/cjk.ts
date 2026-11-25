// What a CJK character is, as the CommonMark CJK-friendly Amendments define it (https://github.com/tats-u/markdown-cjk-friendly/blob/main/specification.md), for the plugins that treat CJK text differently. The three engines must agree on the answer on every runtime, and `\p{…}` expressions answer with the Unicode version the Node or browser running them ships, so the answers come from tables generated from one pinned version: see cjk-ranges.ts and scripts/generate-cjk-ranges.mjs. Every function takes a code point, not a string, so no caller can split a surrogate pair by accident: read one with `text.codePointAt(index)` or `codePointBefore(text, index)`.
import {
  CJK_AMBIGUOUS_PUNCTUATION,
  CJK_CHARACTERS,
  EAST_ASIAN_WIDE,
  HANGUL,
  type CodePointRange
} from "./cjk-ranges.js";

// Binary search. These run for every delimiter and every line break of a document, so they allocate nothing. Latin text is below the first range of every table, which the first comparison settles.
const inRanges = (
  ranges: readonly CodePointRange[],
  codePoint: number
): boolean => {
  if (codePoint < ranges[0]![0]) {
    return false;
  }
  let low = 0;
  let high = ranges.length - 1;
  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const range = ranges[middle]!;
    if (codePoint < range[0]) {
      high = middle - 1;
    } else if (codePoint > range[1]) {
      low = middle + 1;
    } else {
      return true;
    }
  }
  return false;
};

/**
 * Whether the code point's East Asian Width (UAX #11) is W (wide), F (fullwidth) or H (halfwidth). A (ambiguous) is not: `“` and `±` are narrow in most Western text. Emoji are wide too; see `isCjkCharacter` for the set without them. This is the test CSS Text's segment-break rule makes on both sides of a line break.
 */
export const isEastAsianWide = (codePoint: number): boolean =>
  inRanges(EAST_ASIAN_WIDE, codePoint);

/**
 * Whether the code point's Script (UAX #24) is Hangul: syllables, jamo and their compatibility and halfwidth forms. Some jamo are not wide, and Korean puts spaces between words where Chinese and Japanese do not.
 */
export const isHangul = (codePoint: number): boolean =>
  inRanges(HANGUL, codePoint);

/**
 * Whether the code point is a CJK character as the CJK-friendly specification defines it: East Asian Width W, F or H and not an emoji by default (`Emoji_Presentation`), or Hangul. Ideographs, kana, fullwidth and halfwidth forms, CJK punctuation such as `。` and `「`, and wide symbols that show as text by default (`〰`, `㊗`) are; `🎉` is not, though it is wide.
 */
export const isCjkCharacter = (codePoint: number): boolean =>
  inRanges(CJK_CHARACTERS, codePoint);

/**
 * Whether the code point is an Ideographic Variation Selector: the Variation Selectors Supplement block, U+E0100 to U+E01EF, which picks a glyph variant of the ideograph before it.
 */
export const isIdeographicVariationSelector = (codePoint: number): boolean =>
  codePoint >= 0xe0100 && codePoint <= 0xe01ef;

/**
 * Whether the code point is a Non-emoji General-use Variation Selector: the Variation Selectors block, U+FE00 to U+FE0E, without U+FE0F, the selector that asks for emoji presentation.
 */
export const isNonEmojiVariationSelector = (codePoint: number): boolean =>
  codePoint >= 0xfe00 && codePoint <= 0xfe0e;

/**
 * Whether the two code points form a CJK ambiguous punctuation sequence: a standardized variation sequence that asks for the fullwidth form of punctuation whose East Asian Width is A, such as `“` followed by U+FE01. Alone, `“` is not a CJK character.
 */
export const isCjkAmbiguousPunctuationSequence = (
  punctuation: number,
  selector: number
): boolean => {
  // A loop, not `.some()`, which would create a callback on every call.
  for (const sequence of CJK_AMBIGUOUS_PUNCTUATION) {
    if (sequence[0] === punctuation && sequence[1] === selector) {
      return true;
    }
  }
  return false;
};

/**
 * The code point that ends just before `index` in `text`, reading a surrogate pair as one code point: the counterpart of `text.codePointAt(index)`, which reads the one that starts there. A lone surrogate is read as itself. `undefined` when no code point ends at `index`: at the start of the text, or past its end.
 */
export const codePointBefore = (
  text: string,
  index: number
): number | undefined => {
  if (index < 1 || index > text.length) {
    return undefined;
  }
  if (index > 1) {
    const pair = text.codePointAt(index - 2)!;
    if (pair > 0xffff) {
      return pair;
    }
  }
  return text.charCodeAt(index - 1);
};
