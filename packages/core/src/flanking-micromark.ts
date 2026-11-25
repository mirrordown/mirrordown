import type { Code, Point, TokenizeContext } from "micromark-util-types";
import { codePointBefore } from "./cjk.js";
import type { CharacterClass, Neighbour } from "./flanking.js";

// The characters beside a delimiter run in a micromark tokenizer, as `delimiterFlanking` takes them: the micromark side of the shared flanking rule, used by remd-cjk-friendly's constructs and by `scriptSyntax`.

// micromark-util-classify-character, inlined: line endings, tabs, `\s` and the end of the text are whitespace, Unicode P and S are punctuation. It reads one code unit, as micromark's own emphasis does, so on its own an astral character (two surrogates) would be neither; it classifies the codes that are not part of one, and a lone surrogate.
const WHITESPACE = /\s/;
const PUNCTUATION = /\p{P}|\p{S}/u;
export const micromarkClass = (code: Code): CharacterClass =>
  code === null ||
  code < 0 ||
  code === 32 ||
  WHITESPACE.test(String.fromCharCode(code))
    ? `whitespace`
    : PUNCTUATION.test(String.fromCharCode(code))
      ? `punctuation`
      : `other`;

// The same tests on a whole character. A character outside the Basic Multilingual Plane beside a run is read whole, as CommonMark defines it and as markdown-it and Sätteri read it: `🎉` and `𝜵` are punctuation (So, Sm), `𠮷` a letter. micromark's own emphasis reads two code units there and takes every such character for a letter; these readers serve only the constructs that replace it (remd-cjk-friendly's) and Mirrordown's own `~` and `^`.
const characterClass = (codePoint: number): CharacterClass => {
  const character = String.fromCodePoint(codePoint);
  return WHITESPACE.test(character)
    ? `whitespace`
    : PUNCTUATION.test(character)
      ? `punctuation`
      : `other`;
};

// The text of the current string chunk between two of its indices. micromark keeps a line in one chunk up to a tab, a line ending or a NUL, so an index before the chunk reads as the end of the line, which is whitespace to the flanking rule; this is how micromark-extension-cjk-friendly reads it too.
const slice = (
  context: TokenizeContext,
  point: Point,
  from: number,
  to: number
): string =>
  context.sliceSerialize({
    start: { ...point, _bufferIndex: Math.max(from, 0) },
    end: { ...point, _bufferIndex: to }
  });

const isLowSurrogate = (code: number): boolean =>
  code >= 0xdc00 && code <= 0xdfff;
const isHighSurrogate = (code: number): boolean =>
  code >= 0xd800 && code <= 0xdbff;

/**
 * The character before a run that starts at the tokenizer's current point, and a reader for the one before that. Call it where the run starts, before its first marker is consumed: `context.previous` is then the code before the run.
 */
export const micromarkBefore = (
  context: TokenizeContext
): { before: Neighbour; twoBefore: () => Neighbour } => {
  const { previous } = context;
  const point = context.now();
  if (previous === null || previous < 0) {
    return {
      before: { kind: micromarkClass(previous) },
      twoBefore: () => ({ kind: `whitespace` })
    };
  }
  // micromark hands over code units; the character before the run is read whole.
  let codePoint = previous;
  if (isLowSurrogate(previous) && point._bufferIndex >= 2) {
    const pair = slice(
      context,
      point,
      point._bufferIndex - 2,
      point._bufferIndex
    ).codePointAt(0);
    if (pair !== undefined && pair > 0xffff) codePoint = pair;
  }
  const astral = codePoint > 0xffff;
  const end = point._bufferIndex - (astral ? 2 : 1);
  return {
    before: {
      kind: astral ? characterClass(codePoint) : micromarkClass(previous),
      codePoint
    },
    twoBefore: () => {
      if (end < 1) return { kind: `whitespace` };
      const text = slice(context, point, end - 2, end);
      const character = codePointBefore(text, text.length);
      return character === undefined
        ? { kind: `whitespace` }
        : { kind: characterClass(character), codePoint: character };
    }
  };
};

/** The character after a run, `code` being the code that ended it. Call it there, before `code` is consumed. */
export const micromarkAfter = (
  context: TokenizeContext,
  code: Code
): Neighbour => {
  const kind = micromarkClass(code);
  if (code === null || code < 0) return { kind };
  // The character after the run is read whole too.
  if (isHighSurrogate(code)) {
    const point = context.now();
    const pair = slice(
      context,
      point,
      point._bufferIndex,
      point._bufferIndex + 2
    ).codePointAt(0);
    if (pair !== undefined && pair > 0xffff) {
      return { kind: characterClass(pair), codePoint: pair };
    }
  }
  return { kind, codePoint: code };
};
