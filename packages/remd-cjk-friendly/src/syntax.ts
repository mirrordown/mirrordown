import { attention } from "micromark-core-commonmark";
import type {
  Code,
  Construct,
  Effects,
  Event,
  Extension,
  State,
  TokenizeContext
} from "micromark-util-types";
import {
  delimiterFlanking,
  micromarkAfter,
  micromarkBefore
} from "@mirrordown/core";

const ASTERISK = 42;
const UNDERSCORE = 95;
const TILDE = 126;

// micromark's attention tokenizer (micromark-core-commonmark), classifying by the amended flanking rule. Everything else is micromark's: a run is one token, the attention markers that extensions add (GFM's `~`) still let a run open or close beside them, and a `_` run opens or closes inside a word only as micromark lets it.
function tokenizeAttention(
  this: TokenizeContext,
  effects: Effects,
  ok: State
): State {
  const markers = this.parser.constructs.attentionMarkers.null ?? [];
  const { previous } = this;
  const { before, twoBefore } = micromarkBefore(this);
  let marker: Code = null;
  const inside: State = (code) => {
    if (code === marker) {
      effects.consume(code);
      return inside;
    }
    const token = effects.exit(`attentionSequence`);
    const after = micromarkAfter(this, code);
    const { left, right, punctuationBefore } = delimiterFlanking(
      before,
      after,
      true,
      twoBefore
    );
    const open = left || markers.includes(code);
    const close = right || markers.includes(previous);
    token._open =
      marker === ASTERISK
        ? open
        : open && (before.kind === `whitespace` || punctuationBefore || !close);
    token._close =
      marker === ASTERISK ? close : close && (after.kind !== `other` || !open);
    return ok(code);
  };
  return (code) => {
    marker = code;
    effects.enter(`attentionSequence`);
    return inside(code);
  };
}

// Registered after micromark's defaults, as every extension is, so it is tried before micromark's own attention, which then never sees a run. It keeps micromark's name, so disabling `attention` still turns emphasis off, and micromark's resolver, which pairs the runs it classifies.
const attentionCjkFriendly: Construct = {
  name: `attention`,
  tokenize: tokenizeAttention,
  ...(attention.resolveAll ? { resolveAll: attention.resolveAll } : {})
};

// GFM's strikethrough construct, wherever remark-gfm registered it. It is looked up rather than imported: remark-gfm builds it with the processor's `singleTilde` option, which only that instance knows.
const gfmStrikethrough = (context: TokenizeContext): Construct | undefined => {
  const registered = context.parser.constructs.text[TILDE];
  const constructs = Array.isArray(registered)
    ? registered
    : registered
      ? [registered]
      : [];
  return constructs.find(({ name }) => name === `strikethrough`);
};

// GFM's strikethrough tokenizer, run as it is, with its runs then classified by the amended rule. GFM's own answer is CommonMark's on micromark's code units, which takes a character outside the Basic Multilingual Plane for a letter, so ours replaces it: it is CommonMark's answer on whole characters wherever the amendment adds nothing.
function tokenizeStrikethrough(
  this: TokenizeContext,
  effects: Effects,
  ok: State,
  nok: State
): State {
  const gfm = gfmStrikethrough(this);
  // Without GFM, `~~` is not strikethrough, and this construct is not there.
  if (!gfm) return nok;
  const { before, twoBefore } = micromarkBefore(this);
  const classify: State = (code) => {
    const token = this.events.at(-1)?.[1];
    // GFM's token type is not among the types micromark declares, so it is compared as a string.
    const type: string | undefined = token?.type;
    if (token && type === `strikethroughSequenceTemporary`) {
      const { left, right } = delimiterFlanking(
        before,
        micromarkAfter(this, code),
        true,
        twoBefore
      );
      token._open = left;
      token._close = right;
    }
    return ok(code);
  };
  return gfm.tokenize.call(this, effects, classify, nok);
}

// It has a name of its own and switches GFM's off by name, so it is the one micromark tries whichever of remark-gfm and remd-cjk-friendly is listed first; it then runs GFM's.
const strikethroughCjkFriendly: Construct = {
  name: `strikethroughCjkFriendly`,
  tokenize: tokenizeStrikethrough,
  resolveAll: (events: Event[], context: TokenizeContext): Event[] => {
    const resolve = gfmStrikethrough(context)?.resolveAll;
    return resolve ? resolve(events, context) : events;
  }
};

/**
 * The micromark syntax extension of `remarkCjkFriendly`: emphasis (`*`, `_`) and, when GFM is in use, strikethrough (`~~`) classified by the CommonMark CJK-friendly Amendments.
 */
export const cjkFriendlySyntax: Extension = {
  text: {
    [ASTERISK]: attentionCjkFriendly,
    [UNDERSCORE]: attentionCjkFriendly,
    [TILDE]: strikethroughCjkFriendly
  },
  disable: { null: [`strikethrough`] }
};
