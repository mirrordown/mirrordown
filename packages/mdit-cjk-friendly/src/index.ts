import type MarkdownIt from "markdown-it";
import type { Scanned } from "markdown-it/lib/rules_inline/state_inline.mjs";
import {
  codePointBefore,
  delimiterFlanking,
  type Flanking,
  type Neighbour
} from "@mirrordown/core";

// The characters beside a run as markdown-it's own `scanDelims` reads them (markdown-it 14.2): the start and the end of the inline content are a space, a surrogate pair is one character, and a broken one is U+FFFD.
const characterBefore = (src: string, index: number): number => {
  if (index <= 0) return 0x20;
  const codePoint = codePointBefore(src, index) ?? 0x20;
  return codePoint >= 0xd800 && codePoint <= 0xdfff ? 0xfffd : codePoint;
};
const characterAt = (src: string, index: number, max: number): number => {
  if (index >= max) return 0x20;
  const unit = src.charCodeAt(index);
  if (unit >= 0xd800 && unit <= 0xdbff) {
    const low = src.charCodeAt(index + 1);
    return low >= 0xdc00 && low <= 0xdfff
      ? 0x10000 + ((unit - 0xd800) << 10) + (low - 0xdc00)
      : 0xfffd;
  }
  return unit >= 0xdc00 && unit <= 0xdfff ? 0xfffd : unit;
};

// markdown-it's rules for opening and closing, given a run's flanking. A run that cannot split a word (`_`) opens only if it is not right-flanking or follows punctuation, and closes only if it is not left-flanking or precedes punctuation.
const opens = (
  { left, right, punctuationBefore }: Flanking,
  canSplitWord: boolean
): boolean => left && (canSplitWord || !right || punctuationBefore);
const closes = (
  { left, right }: Flanking,
  canSplitWord: boolean,
  punctuationAfter: boolean
): boolean => right && (canSplitWord || !left || punctuationAfter);

/**
 * markdown-it plugin that lets delimiter runs open and close beside CJK punctuation, by the CommonMark CJK-friendly Amendments: `**テスト。**テスト` is strong emphasis, where CommonMark leaves the asterisks as text. Every construct that asks markdown-it's `scanDelims` whether a run can open or close takes the rule: emphasis, strikethrough, and Mirrordown's `==`, `++`, `--`, `||`, `~` and `^`. A run with no CJK character beside it is read as before.
 */
export function cjkFriendly(md: MarkdownIt): void {
  // The engine's own whitespace and punctuation tests; the amendment only adds its CJK clauses to their answers.
  const { isMdAsciiPunct, isPunctChar, isWhiteSpace } = md.utils;
  const neighbour = (codePoint: number): Neighbour => ({
    kind: isWhiteSpace(codePoint)
      ? `whitespace`
      : isMdAsciiPunct(codePoint) ||
          isPunctChar(String.fromCodePoint(codePoint))
        ? `punctuation`
        : `other`,
    codePoint
  });

  // A subclass for this instance only, never markdown-it's shared class. It asks the class it replaces first and changes that answer only where the amendment changes CommonMark's, so another plugin's override (mdit-sub lets `*` flank a `~`) keeps its effect whichever of the two is added first.
  md.inline.State = class extends md.inline.State {
    override scanDelims(start: number, canSplitWord: boolean): Scanned {
      const scanned = super.scanDelims(start, canSplitWord);
      const before = neighbour(characterBefore(this.src, start));
      const after = neighbour(
        characterAt(this.src, start + scanned.length, this.posMax)
      );
      const plain = delimiterFlanking(before, after, false);
      const amended = delimiterFlanking(before, after, true, () =>
        neighbour(characterBefore(this.src, start - 1))
      );
      const punctuationAfter = after.kind === `punctuation`;
      const open = opens(amended, canSplitWord);
      const close = closes(amended, canSplitWord, punctuationAfter);
      if (opens(plain, canSplitWord) !== open) scanned.can_open = open;
      if (closes(plain, canSplitWord, punctuationAfter) !== close) {
        scanned.can_close = close;
      }
      return scanned;
    }
  };
}
