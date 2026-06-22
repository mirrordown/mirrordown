import { factorySpace } from "micromark-factory-space";
import { markdownSpace } from "micromark-util-character";
import { blankLine } from "micromark-core-commonmark";
import { splice } from "micromark-util-chunked";
import type {
  Construct,
  Effects,
  Event,
  Exiter,
  Extension,
  State,
  Token,
  TokenizeContext,
  Tokenizer
} from "micromark-util-types";
import { tokenTypes, clonePoint } from "./types.js";
import { analyzeDefTermFlow, subtokenizeDefTerm } from "./def-term-flow.js";
import type { FlowToken } from "./types.js";

type EventTuple = Event;
interface LazyParser {
  parser: { lazy: Record<number, boolean> };
}

const ignorablePrefixTypes = new Set([
  "linePrefix",
  "blockQuotePrefix",
  "blockQuoteMarker",
  "blockQuotePrefixWhitespace"
]);

// Token types that are transparent when scanning for a valid def-term predecessor.
const skippableFlowTypes = new Set([
  "lineEnding",
  "linePrefix",
  "lineEndingBlank",
  "content"
]);

// Token types that qualify as valid def-term content (tableHead/tableRow from gfm-table).
const validTermTypes = new Set([
  "paragraph",
  "chunkContent",
  "tableHead",
  "tableRow"
]);

const defListConstruct: Construct = {
  name: "defList",
  tokenize: tokenizeDefListStart as Tokenizer,
  continuation: {
    tokenize: tokenizeDefListContinuation as Tokenizer
  },
  resolveAll: resolveAllDefinitionTerm,
  exit: tokenizeDefListEnd as Exiter
};

const defListDescriptionPrefixWhitespaceConstruct: Construct = {
  tokenize: tokenizeDefListDescriptionPrefixWhitespace as Tokenizer,
  partial: true
};

const indentConstruct: Construct = {
  tokenize: tokenizeIndent as Tokenizer,
  partial: true
};

export const defList: Extension = {
  document: {
    [58]: defListConstruct,
    [126]: defListConstruct,
    null: []
  }
};

function resolveAllDefinitionTerm(
  events: Event[],
  context: TokenizeContext
): Event[] {
  const evts = events as EventTuple[];

  let index = 0;
  while (index < evts.length) {
    const event = evts[index];
    if (event[0] === "enter" && event[1].type === tokenTypes.defList) {
      index += resolveDefList(index, evts, context);
    }
    index++;
  }

  // merge adjacent definition lists
  const dlStack: Token[] = [];
  index = 0;
  while (index < evts.length) {
    const event = evts[index];
    if (event[0] === "enter" && event[1].type === tokenTypes.defList) {
      dlStack.push(event[1]);
    } else if (event[0] === "exit" && event[1].type === tokenTypes.defList) {
      // scan forward past ignorable prefix events to find an adjacent defList
      let nextDlOffset = 1;
      while (index + nextDlOffset < evts.length) {
        const ahead = evts[index + nextDlOffset];
        if (ahead[0] === "enter" && ahead[1].type === tokenTypes.defList) break;
        if (!ignorablePrefixTypes.has(ahead[1].type)) {
          nextDlOffset = 0;
          break;
        }
        nextDlOffset++;
      }
      if (nextDlOffset > 0 && index + nextDlOffset < evts.length) {
        // adjacent defList found â€” extend current token and splice out the gap+enter
        event[1].end = clonePoint(evts[index + nextDlOffset][1].end);
        splice(events, index, nextDlOffset + 1, []);
        index -= nextDlOffset;
      } else {
        // no adjacent defList â€” fix up exit token to reference the enter token
        event[1] = dlStack.pop()!;
      }
    }
    index++;
  }
  return events;
}

function resolveDefList(
  defListStart: number,
  events: EventTuple[],
  context: TokenizeContext
): number {
  let indexOffset = 0;
  let defListDescriptionToken: Token | undefined;
  let expectFirstDescription = true;
  const allDescriptionTokens: Token[] = [];
  let index = defListStart + 1;
  index += resolveDefinitionTermTo(defListStart, events);

  while (index < events.length) {
    const event = events[index];

    if (event[0] === "enter" && event[1].type === tokenTypes.defList) {
      index += resolveDefList(index, events, context);
    } else if (event[0] === "exit" && event[1].type === tokenTypes.defList) {
      // if the last description had internal blanks, mark it loose
      if ((event[1] as FlowToken)._prevLoose && defListDescriptionToken) {
        (defListDescriptionToken as FlowToken)._loose = true;
      }
      index += addDescriptionExit(index, events);
      defListDescriptionToken = undefined;
      indexOffset = index - defListStart;

      // propagate loose: if any description is loose, mark all as loose
      if (allDescriptionTokens.some((t) => (t as FlowToken)._loose)) {
        for (const t of allDescriptionTokens) {
          (t as FlowToken)._loose = true;
        }
      }

      break;
    } else if (
      event[0] === "exit" &&
      event[1].type === tokenTypes.defListDescriptionPrefix
    ) {
      if (!expectFirstDescription) {
        index += addDescriptionExit(index, events);
        defListDescriptionToken = undefined;
      }
      index += addDescriptionEnter(
        index,
        events,
        (event[1] as FlowToken)._loose
      );
      expectFirstDescription = false;
    } else if (
      event[0] === "enter" &&
      event[1].type === tokenTypes.defListDescriptionPrefix
    ) {
      // mark the previous description loose if it had internal blanks
      if ((event[1] as FlowToken)._prevLoose && defListDescriptionToken) {
        (defListDescriptionToken as FlowToken)._loose = true;
      }
      // mark this prefix loose if preceded by a blank line (blank between term and first dd)
      if (events[index - 1][1].type === "lineEndingBlank") {
        (event[1] as FlowToken)._loose = true;
      } else if (events[index - 1][1].type === "chunkFlow") {
        const flowEvents = (events[index - 1][1] as FlowToken)._tokenizer
          ?.events;
        if (flowEvents?.[flowEvents.length - 1][1].type === "lineEndingBlank") {
          (event[1] as FlowToken)._loose = true;
        }
      }
    }

    index++;
  }

  return indexOffset;

  function addDescriptionEnter(
    index: number,
    events: EventTuple[],
    loose?: boolean
  ): number {
    defListDescriptionToken = {
      type: tokenTypes.defListDescription,
      start: clonePoint(events[index + 1][1].start),
      end: clonePoint(events[index + 1][1].end),
      _loose: loose
    };
    allDescriptionTokens.push(defListDescriptionToken);
    splice(events, index + 1, 0, [["enter", defListDescriptionToken, context]]);
    return 1;
  }

  function addDescriptionExit(index: number, events: EventTuple[]): number {
    defListDescriptionToken!.end = clonePoint(events[index - 1][1].end);

    // _prevLoose is set on the next prefix when the current description had internal blanks
    // (handled in the enter defListDescriptionPrefix block)

    splice(events, index, 0, [["exit", defListDescriptionToken!, context]]);
    return 1;
  }
}

function createDefTermEvent(
  events: EventTuple[],
  chunkFlowIndex: number,
  defListStartIndex: number,
  flagBlockQuote: boolean
): number {
  const context = events[chunkFlowIndex][2];
  const flow = analyzeDefTermFlow(events[chunkFlowIndex][1] as FlowToken);
  const paragraphInfo = flow.paragraph;

  if (paragraphInfo == null) {
    const defListEnterEvent = events[defListStartIndex];
    const termToken: Token = {
      type: tokenTypes.defListTerm,
      start: clonePoint(defListEnterEvent[1].start),
      end: clonePoint(defListEnterEvent[1].start)
    };
    splice(events, defListStartIndex, 0, [
      ["enter", termToken, context],
      ["exit", termToken, context]
    ]);
    return defListStartIndex;
  }

  const lazyLines = (events[chunkFlowIndex][2] as unknown as LazyParser).parser
    .lazy;
  let newDefListStartIndex = 0;
  let flowExitIndex: number | undefined;

  for (let i = chunkFlowIndex; i >= 0; i--) {
    const event = events[i];
    if (event[1].type !== "chunkFlow") {
      newDefListStartIndex = i + 1;
      break;
    }
    if (event[1].start.offset < paragraphInfo.startOffset) {
      newDefListStartIndex = i + 1;
      break;
    }
    if (event[0] === "exit") {
      if (flagBlockQuote && !lazyLines[event[1].start.line]) {
        newDefListStartIndex = i + 1;
        break;
      }
      flowExitIndex = i;
    } else {
      subtokenizeDefTerm(events, i, flowExitIndex);
      flowExitIndex = undefined;
    }
  }

  return newDefListStartIndex;
}

function resolveDefinitionTermTo(
  defListStartIndex: number,
  events: EventTuple[]
): number {
  let flowIndex: number | undefined;
  let blockQuoteExit: EventTuple | undefined;
  let blockQuoteExitIndex: number | undefined;

  for (let i = defListStartIndex - 1; i >= 0; i--) {
    if (ignorablePrefixTypes.has(events[i][1].type)) continue;
    if (
      i === defListStartIndex - 1 &&
      events[i][1].type === "blockQuote" &&
      events[i][0] === "exit"
    ) {
      blockQuoteExitIndex = i;
      blockQuoteExit = events[i];
      continue;
    }
    if (events[i][1].type === "chunkFlow") {
      flowIndex = i;
    }
    break;
  }

  const defListEnterEvent = events[defListStartIndex];
  splice(events, defListStartIndex, 1, []);

  if (blockQuoteExitIndex != null) {
    splice(events, blockQuoteExitIndex, 1, []);
  }

  let newDefListStartIndex = createDefTermEvent(
    events,
    flowIndex!,
    defListStartIndex,
    blockQuoteExit != null
  );

  if (blockQuoteExitIndex != null) {
    blockQuoteExit![1].end = clonePoint(
      events[newDefListStartIndex - 1][1].end
    );
    splice(events, newDefListStartIndex, 0, [blockQuoteExit!]);
    newDefListStartIndex += 1;
  }

  defListEnterEvent[1].start = clonePoint(
    events[newDefListStartIndex][1].start
  );
  splice(events, newDefListStartIndex, 0, [defListEnterEvent]);
  return newDefListStartIndex - defListStartIndex;
}

function checkPossibleDefTerm(events: EventTuple[]): boolean {
  if (events.length <= 1) return false;

  const lastEvent = events[events.length - 1];
  const lazyLines = (lastEvent[2] as unknown as LazyParser).parser.lazy;
  let flagBlockQuote = false;
  let termFlowStart: EventTuple | undefined;
  let flowEvents: EventTuple[] | undefined;

  for (let i = events.length - 1; i >= 0; i--) {
    const event = events[i];
    if (ignorablePrefixTypes.has(event[1].type)) continue;
    if (
      i === events.length - 1 &&
      event[1].type === "blockQuote" &&
      event[0] === "exit"
    ) {
      flagBlockQuote = true;
      continue;
    }
    if (event[1].type === "chunkFlow") {
      if (event[0] === "enter") {
        flowEvents ??= (event[1] as FlowToken)._tokenizer?.events as
          | EventTuple[]
          | undefined;
        termFlowStart = event;
      }
    } else {
      break;
    }
  }

  if (flowEvents != null && termFlowStart != null) {
    let blanklines = 0;
    for (let i = flowEvents.length - 1; i >= 0; i--) {
      const flowEvent = flowEvents[i];
      const tmpToken = flowEvent[1];
      if (tmpToken.start.offset < termFlowStart[1].start.offset) break;
      if (flowEvent[0] === "enter" && tmpToken.type === "lineEndingBlank") {
        if (blanklines >= 1) break;
        blanklines++;
      }
      if (!skippableFlowTypes.has(tmpToken.type as string)) {
        if (flagBlockQuote && !lazyLines[tmpToken.end.line]) return false;
        return validTermTypes.has(tmpToken.type as string);
      }
    }
  }

  return false;
}

function tokenizeDefListStart(
  this: TokenizeContext,
  effects: Effects,
  ok: State,
  nok: State
): State {
  this.containerState ??= {};

  const tail = this.events[this.events.length - 1];
  let initialSize =
    tail[1].type === "linePrefix"
      ? tail[2].sliceSerialize(tail[1], true).length
      : 0;

  if (this.containerState.type == null) {
    if (checkPossibleDefTerm(this.events as EventTuple[])) {
      effects.enter(tokenTypes.defList, { _container: true });
      this.containerState.type = tokenTypes.defList;
    } else {
      return nok;
    }
  }

  const start = (code: number | null): State | undefined => {
    if (code !== 58 /* : */ && code !== 126 /* ~ */) return nok(code);

    effects.enter(tokenTypes.defListDescriptionPrefix, {
      _loose: this.containerState?.lastBlankLine,
      _prevLoose: this.containerState?.hadBlankInDescription
    });
    this.containerState!.lastBlankLine = undefined;
    this.containerState!.hadBlankInDescription = undefined;
    effects.enter(tokenTypes.defListDescriptionMarker);
    effects.consume(code);
    effects.exit(tokenTypes.defListDescriptionMarker);
    return effects.check(
      blankLine,
      nok,
      effects.attempt(
        defListDescriptionPrefixWhitespaceConstruct,
        prefixEnd,
        otherPrefix
      )
    );
  };

  const otherPrefix = (code: number | null): State | undefined => {
    if (markdownSpace(code)) {
      effects.enter(tokenTypes.defListDescriptionPrefixWhitespace);
      effects.consume(code);
      effects.exit(tokenTypes.defListDescriptionPrefixWhitespace);
      return prefixEnd;
    }
    return nok(code);
  };

  const prefixEnd = (code: number | null): State | undefined => {
    this.containerState!.size =
      initialSize +
      this.sliceSerialize(
        effects.exit(tokenTypes.defListDescriptionPrefix),
        true
      ).length;
    return ok(code);
  };

  return start;
}

function tokenizeDefListContinuation(
  this: TokenizeContext,
  effects: Effects,
  ok: State,
  nok: State
): State {
  this.containerState!._closeFlow = undefined;

  const onBlank = (code: number | null): State | undefined => {
    this.containerState!.furtherBlankLines =
      this.containerState!.furtherBlankLines ?? false;
    this.containerState!.lastBlankLine = true;
    return factorySpace(
      effects,
      ok,
      "linePrefix",
      this.containerState!.size! + 1
    )(code);
  };

  const notInCurrentItem = (code: number | null): State | undefined => {
    this.containerState!._closeFlow = true;
    // interrupt is set by the micromark runtime on TokenizeContext
    (this as unknown as { interrupt: boolean | undefined }).interrupt =
      undefined;
    return factorySpace(
      effects,
      effects.attempt(defListConstruct, ok, nok),
      "linePrefix",
      this.parser.constructs.disable.null?.includes("codeIndented")
        ? undefined
        : 4
    )(code);
  };

  const notBlank = (code: number | null): State | undefined => {
    if (this.containerState!.furtherBlankLines ?? !markdownSpace(code)) {
      this.containerState!.furtherBlankLines = undefined;
      return notInCurrentItem(code);
    }
    const hadBlank = this.containerState!.lastBlankLine;
    this.containerState!.furtherBlankLines = undefined;
    this.containerState!.lastBlankLine = undefined;
    // indentOk is the success branch of the attempt â€” only reached when indented
    // continuation is accepted, meaning the preceding blank was genuinely internal
    const indentOk = (code: number | null): State | undefined => {
      if (hadBlank) this.containerState!.hadBlankInDescription = true;
      return ok(code);
    };
    return effects.attempt(indentConstruct, indentOk, notInCurrentItem)(code);
  };

  return effects.check(blankLine, onBlank, notBlank);
}

function tokenizeIndent(
  this: TokenizeContext,
  effects: Effects,
  ok: State,
  nok: State
): State {
  const afterPrefix = (code: number | null): State | undefined => {
    const tail = this.events[this.events.length - 1];
    return tail[1].type === "linePrefix" &&
      tail[2].sliceSerialize(tail[1], true).length === this.containerState!.size
      ? ok(code)
      : nok(code);
  };
  return factorySpace(
    effects,
    afterPrefix,
    "linePrefix",
    this.containerState!.size! + 1
  );
}

function tokenizeDefListDescriptionPrefixWhitespace(
  this: TokenizeContext,
  effects: Effects,
  ok: State,
  nok: State
): State {
  const afterPrefix = (code: number | null): State | undefined => {
    const tail = this.events[this.events.length - 1];
    return !markdownSpace(code) &&
      tail[1].type === tokenTypes.defListDescriptionPrefixWhitespace
      ? ok(code)
      : nok(code);
  };
  return factorySpace(
    effects,
    afterPrefix,
    tokenTypes.defListDescriptionPrefixWhitespace,
    this.parser.constructs.disable.null?.includes("codeIndented")
      ? undefined
      : 4 + 1
  );
}

function tokenizeDefListEnd(this: TokenizeContext, effects: Effects): void {
  const defListToken = effects.exit(tokenTypes.defList);
  if (this.containerState?.hadBlankInDescription) {
    (defListToken as FlowToken)._prevLoose = true;
    this.containerState.hadBlankInDescription = undefined;
  }
}
