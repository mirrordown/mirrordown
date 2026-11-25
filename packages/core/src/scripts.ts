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
import { delimiterFlanking } from "./flanking.js";
import { micromarkAfter, micromarkBefore } from "./flanking-micromark.js";

// micromark syntax for `~subscript~` and `^superscript^`, shared by remd-sub and remd-sup. Each marker is a single-character delimiter run with emphasis-style flanking. One resolver pairs both markers: it takes closers left to right and pairs each with the nearest opener of the same marker, so runs of the two markers that cross each other (`^a~b^c~`) resolve leftmost-first and the two nest, as in markdown-it and Sätteri. That holds between `~` and `^` only: emphasis and other constructs have resolvers of their own, micromark runs them in the order the constructs first occur in the text, and where a span crosses one of theirs markdown-it pairs differently. It runs once however many of the two constructs a document uses, because micromark calls each `resolveAll` function once.

/** The marker characters. Spelled out rather than taken from `SCRIPTS`, which would bring the table into the public API through `scriptSyntax`, and JSR wants explicit types there. */
type Marker = "~" | "^";

/** The marker characters, and the micromark token types each produces. */
const SCRIPTS = {
  "~": { code: 126, type: `subscript` },
  "^": { code: 94, type: `superscript` }
} as const satisfies Record<Marker, { code: number; type: string }>;

// Extensions register their token types by augmenting micromark's TokenTypeMap, which JSR rejects; this one assertion stands in for it.
// oxlint-disable-next-line typescript/no-unsafe-type-assertion
const tokenType = (type: string): TokenType => type as TokenType;
const temporary = (type: string): TokenType =>
  tokenType(`${type}SequenceTemporary`);
// Looked up for every event on every resolver call, so the names are built once.
const TEMPORARY = new Map<string, (typeof SCRIPTS)[Marker]>(
  Object.values(SCRIPTS).map((script) => [temporary(script.type), script])
);
const scriptOf = (tokenType: string): (typeof SCRIPTS)[Marker] | undefined =>
  TEMPORARY.get(tokenType);

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

// `cjkFriendly` is read when a document is parsed, so the plugin that turns the amended flanking rule on may be listed before or after the one that registers the construct.
function tokenize(
  this: TokenizeContext,
  effects: Effects,
  ok: State,
  nok: State,
  cjkFriendly: () => boolean
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
    const { before, twoBefore } = micromarkBefore(this);
    effects.enter(temporary(script.type));
    effects.consume(start);
    return (after: Code) => {
      // A run of two or more is not a delimiter (`~~` is strikethrough's).
      if (after === script.code) return nok(after);
      const token = effects.exit(temporary(script.type));
      const { left, right } = delimiterFlanking(
        before,
        micromarkAfter(this, after),
        cjkFriendly(),
        twoBefore
      );
      token._open = left;
      token._close = right;
      return ok(after);
    };
  };
}

const off = (): boolean => false;

/** The shape of a micromark syntax extension this module builds. */
export interface ScriptSyntax {
  text: Record<number, unknown>;
  insideSpan: { null: unknown[] };
}

/**
 * The micromark syntax extension for one of the two markers: `~` (subscript, `subscript` tokens) or `^` (superscript, `superscript` tokens). The constructs of both markers resolve together. `cjkFriendly` says, when a document is parsed, whether runs flank by the CJK-friendly amendment (see `delimiterFlanking`); by default they flank as in CommonMark.
 */
export const scriptSyntax = (
  marker: Marker,
  cjkFriendly: () => boolean = off
): ScriptSyntax => {
  const construct: Construct = {
    name: SCRIPTS[marker].type,
    tokenize(effects, ok, nok) {
      return tokenize.call(this, effects, ok, nok, cjkFriendly);
    },
    resolveAll: resolveScripts
  };
  return {
    text: { [SCRIPTS[marker].code]: construct },
    insideSpan: { null: [construct] }
  };
};
