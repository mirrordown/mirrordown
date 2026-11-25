// Whether a delimiter run can open or close, from the characters beside it: CommonMark's left- and right-flanking definitions, and the same definitions as the CommonMark CJK-friendly Amendments change them (https://github.com/tats-u/markdown-cjk-friendly/blob/main/specification.md). Every delimiter in the suite decides through this one function, in every engine: markdown-it's `scanDelims` (emphasis, strikethrough and the span plugins), the micromark constructs of remd-cjk-friendly and remd-sub/remd-sup, and the delimiter scan of the remark and Sätteri span plugins. Whitespace and punctuation are each engine's own answer, passed in: the engines already classify them, and their answers differ in places (markdown-it's whitespace list against micromark's `\s`; the micromark readers in `flanking-micromark.ts` read a character outside the Basic Multilingual Plane whole, where micromark's own emphasis reads two code units). The amendment adds its CJK clauses on top of those answers and replaces none of them, so a run with no CJK character beside it is classified exactly as before.
import {
  isCjkAmbiguousPunctuationSequence,
  isCjkCharacter,
  isIdeographicVariationSelector,
  isNonEmojiVariationSelector
} from "./cjk.js";

/** How an engine classifies a character beside a delimiter run, by its own whitespace and punctuation tests. */
export type CharacterClass = `whitespace` | `punctuation` | `other`;

/**
 * A character beside a delimiter run, as the engine sees it: the engine's own class for it, and its code point. Leave `codePoint` out where the engine sees an edge or markup rather than a character of the text: the start and the end of a line are `whitespace`, another construct's delimiter is `punctuation`.
 */
export interface Neighbour {
  kind: CharacterClass;
  codePoint?: number | undefined;
}

/** What a delimiter run's neighbours make of it. */
export interface Flanking {
  /** The run is left-flanking: it can open. */
  left: boolean;
  /** The run is right-flanking: it can close. */
  right: boolean;
  /** The run follows punctuation: a Unicode punctuation character, or under the amendment a Unicode punctuation sequence (punctuation and a variation selector). A `_` run that is both left- and right-flanking opens only after one (CommonMark's rules 2 and 6). */
  punctuationBefore: boolean;
}

// The key in a unified processor's data that turns the amendment on for the remark plugins' own delimiters. Namespaced, since every plugin of a processor shares its data.
const CJK_FRIENDLY = `mirrordownCjkFriendly`;

/**
 * Turn the CJK-friendly flanking rule on for the Mirrordown delimiters of one unified processor, given its `data()`. `remarkCjkFriendly` calls it.
 */
export const enableCjkFriendly = (data: object): void => {
  Reflect.set(data, CJK_FRIENDLY, true);
};

/**
 * Whether the CJK-friendly flanking rule is on for a unified processor, given its `data()`. Read it when a document is parsed or transformed, not when a plugin is attached: plugins attach in the order they are listed, so `remarkCjkFriendly` may not have run yet.
 */
export const cjkFriendlyEnabled = (data: object): boolean =>
  Reflect.get(data, CJK_FRIENDLY) === true;

const isCjk = (codePoint: number | undefined): boolean =>
  codePoint !== undefined && isCjkCharacter(codePoint);

/**
 * Classify a delimiter run by the characters beside it. `before` and `after` are the characters right before and right after the run. With `cjkFriendly`, the amended definitions apply, and `twoBefore` reads the character before `before`: it is called only when `before` is a variation selector, which belongs to the character it follows.
 */
export const delimiterFlanking = (
  before: Neighbour,
  after: Neighbour,
  cjkFriendly: boolean,
  twoBefore?: () => Neighbour
): Flanking => {
  // Under the amendment, a non-emoji variation selector belongs to the character it follows: `「︀**` is preceded by `「`. One that follows whitespace or the edge of a line belongs to nothing, and the specification leaves that case open; it stays the character before the run, as CommonMark reads it.
  let base = before;
  let selector: number | undefined;
  if (
    cjkFriendly &&
    twoBefore &&
    before.codePoint !== undefined &&
    isNonEmojiVariationSelector(before.codePoint)
  ) {
    const previous = twoBefore();
    if (previous.kind !== `whitespace`) {
      base = previous;
      selector = before.codePoint;
    }
  }
  const beforeWhitespace = base.kind === `whitespace`;
  const afterWhitespace = after.kind === `whitespace`;
  const punctuationBefore = base.kind === `punctuation`;
  // Whitespace first, before any CJK test: U+3000 IDEOGRAPHIC SPACE is a CJK character by the definition, and beside a delimiter it is whitespace, as in CommonMark. With whitespace on either side, CommonMark's answer stands under the amendment too.
  if (beforeWhitespace || afterWhitespace) {
    return {
      left: !afterWhitespace,
      right: !beforeWhitespace,
      punctuationBefore
    };
  }
  const afterPunctuation = after.kind === `punctuation`;
  const left = !afterPunctuation || punctuationBefore;
  const right = !punctuationBefore || afterPunctuation;
  // Punctuation on both sides or on neither: the run flanks both ways, with or without the amendment.
  if (!cjkFriendly || (left && right))
    return { left, right, punctuationBefore };
  // Punctuation on one side only. CommonMark then flanks only toward the punctuation, which is why `**テスト。**テスト` stays literal: the closer follows `。` and precedes `テ`. The amendment flanks both ways when either side is a CJK character (a CJK sequence before, with the four quotation marks that U+FE01 makes fullwidth), since CJK text puts no space where CommonMark expects one.
  const cjk =
    isCjk(after.codePoint) ||
    isCjk(base.codePoint) ||
    (selector !== undefined &&
      base.codePoint !== undefined &&
      isCjkAmbiguousPunctuationSequence(base.codePoint, selector));
  // An ideographic variation selector stands for the ideograph it follows, so a run after one can open before punctuation (`字󠄀**「x」**`). It is not punctuation, so a run after one can close already.
  const ideographic =
    selector === undefined &&
    base.codePoint !== undefined &&
    isIdeographicVariationSelector(base.codePoint);
  return {
    left: left || cjk || ideographic,
    right: right || cjk,
    punctuationBefore
  };
};
