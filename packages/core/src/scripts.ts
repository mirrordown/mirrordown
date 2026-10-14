import type {
  Code,
  Construct,
  Event,
  Resolver,
  State,
  TokenizeContext,
  TokenType,
  Effects
} from "micromark-util-types";

// micromark syntax for `~subscript~` and `^superscript^`, shared by remd-sub and remd-sup. Each marker is a single-character delimiter run with emphasis-style flanking. One resolver pairs both markers: it takes closers left to right and pairs each with the nearest opener of the same marker, so crossing runs (`^a~b^c~`) resolve leftmost-first and the two nest, as in markdown-it and Sätteri. It runs once however many of the two constructs a document uses, because micromark calls each `resolveAll` function once.

/** The marker characters, and the micromark token types each produces. */
const SCRIPTS = {
  "~": { code: 126, type: `subscript` },
  "^": { code: 94, type: `superscript` }
} as const;

type Marker = keyof typeof SCRIPTS;

// Extensions register their token types by augmenting micromark's TokenTypeMap, which JSR rejects; this one assertion stands in for it.
// oxlint-disable-next-line typescript/no-unsafe-type-assertion
const tokenType = (type: string): TokenType => type as TokenType;
const temporary = (type: string): TokenType =>
  tokenType(`${type}SequenceTemporary`);
const scriptOf = (tokenType: string): (typeof SCRIPTS)[Marker] | undefined =>
  Object.values(SCRIPTS).find(({ type }) => temporary(type) === tokenType);

// micromark-util-classify-character, inlined: 1 = whitespace, 2 = punctuation.
const PUNCTUATION = /\p{P}|\p{S}/u;
const WHITESPACE = /\s/;
const classify = (code: Code): 1 | 2 | undefined =>
  code === null ||
  code < 0 ||
  code === 32 ||
  WHITESPACE.test(String.fromCharCode(code))
    ? 1
    : PUNCTUATION.test(String.fromCharCode(code))
      ? 2
      : undefined;

// micromark-util-chunked's `splice`, inlined: spreading a long list into Array#splice can overflow the stack.
const splice = <T>(
  list: T[],
  start: number,
  remove: number,
  items: T[]
): void => {
  list.splice(start, remove);
  for (let i = 0; i < items.length; i += 10_000) {
    list.splice(start + i, 0, ...items.slice(i, i + 10_000));
  }
};

// micromark-util-resolve-all, inlined: run each distinct resolver once.
const resolveAll = (
  constructs: ReadonlyArray<Pick<Construct, "resolveAll">>,
  events: Event[],
  context: TokenizeContext
): Event[] => {
  const called: Resolver[] = [];
  let result = events;
  for (const { resolveAll: resolve } of constructs) {
    if (resolve && !called.includes(resolve)) {
      result = resolve(result, context);
      called.push(resolve);
    }
  }
  return result;
};

const resolveScripts: Resolver = (events, context) => {
  for (let index = 0; index < events.length; index++) {
    const [kind, closer] = events.at(index) ?? [];
    const script = closer && scriptOf(closer.type);
    if (kind !== `enter` || !closer || !script || !closer._close) continue;

    for (let open = index - 1; open >= 0; open--) {
      const [openKind, opener] = events.at(open) ?? [];
      if (
        openKind !== `exit` ||
        !opener ||
        opener.type !== closer.type ||
        !opener._open
      )
        continue;

      opener.type = tokenType(`${script.type}Sequence`);
      closer.type = tokenType(`${script.type}Sequence`);
      const span = {
        type: tokenType(script.type),
        start: { ...opener.start },
        end: { ...closer.end }
      };
      const text = {
        type: tokenType(`${script.type}Text`),
        start: { ...opener.end },
        end: { ...closer.start }
      };
      const next: Event[] = [
        [`enter`, span, context],
        [`enter`, opener, context],
        [`exit`, opener, context],
        [`enter`, text, context],
        // Resolve what is between first: runs that open inside the span close inside it or not at all.
        ...resolveAll(
          context.parser.constructs.insideSpan.null ?? [],
          events.slice(open + 1, index),
          context
        ),
        [`exit`, text, context],
        [`enter`, closer, context],
        [`exit`, closer, context],
        [`exit`, span, context]
      ];
      splice(events, open - 1, index - open + 3, next);
      index = open + next.length - 2;
      break;
    }
  }
  // Runs left unpaired are plain text.
  for (const [, token] of events) {
    if (scriptOf(token.type)) token.type = `data`;
  }
  return events;
};

function tokenize(
  this: TokenizeContext,
  effects: Effects,
  ok: State,
  nok: State
): State {
  const { previous, events } = this;
  return (start: Code) => {
    const script = Object.values(SCRIPTS).find((s) => s.code === start);
    if (!script) return nok(start);
    // Only the start of a run: the rest of a longer run stays text.
    if (
      previous === script.code &&
      events.at(-1)?.[1].type !== `characterEscape`
    )
      return nok(start);
    effects.enter(temporary(script.type));
    effects.consume(start);
    return (after: Code) => {
      // A run of two or more is not a delimiter (`~~` is strikethrough's).
      if (after === script.code) return nok(after);
      const token = effects.exit(temporary(script.type));
      const before = classify(previous);
      const next = classify(after);
      token._open = !next || (next === 2 && Boolean(before));
      token._close = !before || (before === 2 && Boolean(next));
      return ok(after);
    };
  };
}

/** The shape of a micromark syntax extension this module builds. */
export interface ScriptSyntax {
  text: Record<number, unknown>;
  insideSpan: { null: unknown[] };
}

/**
 * The micromark syntax extension for one of the two markers: `~` (subscript, `subscript` tokens) or `^` (superscript, `superscript` tokens). The constructs of both markers resolve together.
 */
export const scriptSyntax = (marker: Marker): ScriptSyntax => {
  const construct: Construct = {
    name: SCRIPTS[marker].type,
    tokenize,
    resolveAll: resolveScripts
  };
  return {
    text: { [SCRIPTS[marker].code]: construct },
    insideSpan: { null: [construct] }
  };
};
