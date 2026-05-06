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
  Tokenizer,
} from "micromark-util-types";
import { tokenTypes } from "./types.js";
import { analyzeDefTermFlow, subtokenizeDefTerm } from "./def-term-flow.js";
import type { FlowToken } from "./types.js";

type EventTuple = [string, Token, TokenizeContext];
type LazyParser = { parser: { lazy: Record<number, boolean> } };

const ignorablePrefixTypes = new Set([
  "linePrefix",
  "blockQuotePrefix",
  "blockQuoteMarker",
  "blockQuotePrefixWhitespace",
]);

const defListConstruct: Construct = {
  name: "defList",
  tokenize: tokenizeDefListStart as Tokenizer,
  continuation: {
    tokenize: tokenizeDefListContinuation as Tokenizer,
  },
  resolveAll: resolveAllDefinitionTerm,
  exit: tokenizeDefListEnd as Exiter,
};

const defListDescriptionPrefixWhitespaceConstruct: Construct = {
  tokenize: tokenizeDefListDescriptionPrefixWhitespace as Tokenizer,
  partial: true,
};

const indentConstruct: Construct = {
  tokenize: tokenizeIndent as Tokenizer,
  partial: true,
};

export const defList: Extension = {
  document: {
    [58]: defListConstruct,
    [126]: defListConstruct,
    null: [],
  },
};

function resolveAllDefinitionTerm(events: Event[], context: TokenizeContext): Event[] {
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
    }
    if (event[0] === "exit" && event[1].type === tokenTypes.defList) {
      let defListFound = false;
      let i = 1;
      while (index + i < evts.length) {
        const forwardEvent = evts[index + i];
        if (forwardEvent[0] === "enter" && forwardEvent[1].type === tokenTypes.defList) {
          defListFound = true;
          break;
        } else if (!ignorablePrefixTypes.has(forwardEvent[1].type)) {
          break;
        }
        i++;
      }
      if (defListFound) {
        event[1].end = Object.assign({}, evts[index + i][1].end);
        splice(events, index, i + 1, []);
        index -= i;
      } else {
        const token = dlStack.pop();
        event[1] = token!;
      }
    }
    index++;
  }
  return events;
}

function resolveDefList(
  defListStart: number,
  events: EventTuple[],
  context: TokenizeContext,
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
    }

    if (event[0] === "exit" && event[1].type === tokenTypes.defList) {
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
    }

    if (event[0] === "exit" && event[1].type === tokenTypes.defListDescriptionPrefix) {
      if (!expectFirstDescription) {
        index += addDescriptionExit(index, events);
        defListDescriptionToken = undefined;
      }
      index += addDescriptionEnter(index, events, (event[1] as FlowToken)._loose);
      expectFirstDescription = false;
    }

    if (event[0] === "enter" && event[1].type === tokenTypes.defListDescriptionPrefix) {
      // mark the previous description loose if it had internal blanks
      if ((event[1] as FlowToken)._prevLoose && defListDescriptionToken) {
        (defListDescriptionToken as FlowToken)._loose = true;
      }
      // mark this prefix loose if preceded by a blank line (blank between term and first dd)
      if (events[index - 1][1].type === "lineEndingBlank") {
        (event[1] as FlowToken)._loose = true;
      } else if (events[index - 1][1].type === "chunkFlow") {
        const flowEvents = (events[index - 1][1] as FlowToken)._tokenizer?.events;
        if (flowEvents && flowEvents[flowEvents.length - 1][1].type === "lineEndingBlank") {
          (event[1] as FlowToken)._loose = true;
        }
      }
    }

    index++;
  }

  return indexOffset;

  function addDescriptionEnter(index: number, events: EventTuple[], loose?: boolean): number {
    defListDescriptionToken = {
      type: tokenTypes.defListDescription,
      start: Object.assign({}, events[index + 1][1].start),
      end: Object.assign({}, events[index + 1][1].end),
      _loose: loose,
    };
    allDescriptionTokens.push(defListDescriptionToken);
    splice(events as Event[], index + 1, 0, [["enter", defListDescriptionToken, context] as Event]);
    return 1;
  }

  function addDescriptionExit(index: number, events: EventTuple[]): number {
    defListDescriptionToken!.end = Object.assign({}, events[index - 1][1].end);

    // _prevLoose is set on the next prefix when the current description had internal blanks
    // (handled in the enter defListDescriptionPrefix block)

    splice(events as Event[], index, 0, [["exit", defListDescriptionToken!, context] as Event]);
    return 1;
  }
}

function createDefTermEvent(
  events: EventTuple[],
  chunkFlowIndex: number,
  defListStartIndex: number,
  flagBlockQuote: boolean,
): number {
  const context = events[chunkFlowIndex][2];
  const flow = analyzeDefTermFlow(events[chunkFlowIndex][1] as FlowToken);
  const paragraphInfo = flow.paragraph;

  if (paragraphInfo == null) {
    const defListEnterEvent = events[defListStartIndex];
    const termToken: Token = {
      type: tokenTypes.defListTerm,
      start: Object.assign({}, defListEnterEvent[1].start),
      end: Object.assign({}, defListEnterEvent[1].start),
    };
    splice(events as Event[], defListStartIndex, 0, [
      ["enter", termToken, context] as Event,
      ["exit", termToken, context] as Event,
    ]);
    return defListStartIndex;
  }

  const lazyLines = (events[chunkFlowIndex][2] as unknown as LazyParser).parser.lazy;
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

function resolveDefinitionTermTo(defListStartIndex: number, events: EventTuple[]): number {
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
  splice(events as Event[], defListStartIndex, 1, []);

  if (blockQuoteExitIndex != null) {
    splice(events as Event[], blockQuoteExitIndex, 1, []);
  }

  let newDefListStartIndex = createDefTermEvent(
    events,
    flowIndex!,
    defListStartIndex,
    blockQuoteExit != null,
  );

  if (blockQuoteExitIndex != null) {
    blockQuoteExit![1].end = Object.assign({}, events[newDefListStartIndex - 1][1].end);
    splice(events as Event[], newDefListStartIndex, 0, [blockQuoteExit! as Event]);
    newDefListStartIndex += 1;
  }

  defListEnterEvent[1].start = Object.assign({}, events[newDefListStartIndex][1].start);
  splice(events as Event[], newDefListStartIndex, 0, [defListEnterEvent as Event]);
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
    if (i === events.length - 1 && event[1].type === "blockQuote" && event[0] === "exit") {
      flagBlockQuote = true;
      continue;
    }
    if (event[1].type === "chunkFlow") {
      if (event[0] === "enter") {
        flowEvents ??= (event[1] as FlowToken)._tokenizer?.events as EventTuple[] | undefined;
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
      if (
        tmpToken.type !== "lineEnding" &&
        tmpToken.type !== "linePrefix" &&
        tmpToken.type !== "lineEndingBlank" &&
        tmpToken.type !== "content"
      ) {
        if (flagBlockQuote && !lazyLines[tmpToken.end.line]) return false;
        // tableHead/tableRow are added by gfm-table extension; check via string comparison
        const t = tmpToken.type as string;
        return t === "paragraph" || t === "chunkContent" || t === "tableHead" || t === "tableRow";
      }
    }
  }

  return false;
}

function tokenizeDefListStart(
  this: TokenizeContext,
  effects: Effects,
  ok: State,
  nok: State,
): State {
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const self = this;
  if (self.containerState == null) {
    self.containerState = {};
  }

  const tail = self.events[self.events.length - 1];
  let initialSize =
    tail && tail[1].type === "linePrefix" ? tail[2].sliceSerialize(tail[1], true).length : 0;

  if (self.containerState.type == null) {
    if (checkPossibleDefTerm(self.events as EventTuple[])) {
      effects.enter(tokenTypes.defList, { _container: true });
      self.containerState.type = tokenTypes.defList;
    } else {
      return nok;
    }
  }

  return start;

  function start(code: number | null): State | undefined {
    if (code !== 58 /* : */ && code !== 126 /* ~ */) return nok(code);

    effects.enter(tokenTypes.defListDescriptionPrefix, {
      _loose: self.containerState?.lastBlankLine,
      _prevLoose: self.containerState?.hadBlankInDescription,
    });
    self.containerState!.lastBlankLine = undefined;
    self.containerState!.hadBlankInDescription = undefined;
    effects.enter(tokenTypes.defListDescriptionMarker);
    effects.consume(code);
    effects.exit(tokenTypes.defListDescriptionMarker);
    return effects.check(
      blankLine,
      nok,
      effects.attempt(defListDescriptionPrefixWhitespaceConstruct, prefixEnd, otherPrefix),
    );
  }

  function otherPrefix(code: number | null): State | undefined {
    if (markdownSpace(code)) {
      effects.enter(tokenTypes.defListDescriptionPrefixWhitespace);
      effects.consume(code!);
      effects.exit(tokenTypes.defListDescriptionPrefixWhitespace);
      return prefixEnd;
    }
    return nok(code);
  }

  function prefixEnd(code: number | null): State | undefined {
    self.containerState!.size =
      initialSize +
      self.sliceSerialize(effects.exit(tokenTypes.defListDescriptionPrefix), true).length;
    return ok(code);
  }
}

function tokenizeDefListContinuation(
  this: TokenizeContext,
  effects: Effects,
  ok: State,
  nok: State,
): State {
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const self = this;
  self.containerState!._closeFlow = undefined;
  return effects.check(blankLine, onBlank, notBlank);

  function onBlank(code: number | null): State | undefined {
    self.containerState!.furtherBlankLines = self.containerState!.furtherBlankLines ?? false;
    self.containerState!.lastBlankLine = true;
    return factorySpace(effects, ok, "linePrefix", self.containerState!.size! + 1)(code);
  }

  function notBlank(code: number | null): State | undefined {
    if (self.containerState!.furtherBlankLines ?? !markdownSpace(code)) {
      self.containerState!.furtherBlankLines = undefined;
      return notInCurrentItem(code);
    }
    const hadBlank = self.containerState!.lastBlankLine;
    self.containerState!.furtherBlankLines = undefined;
    self.containerState!.lastBlankLine = undefined;
    return effects.attempt(indentConstruct, indentOk, notInCurrentItem)(code);

    function indentOk(code: number | null): State | undefined {
      // blank was seen and continuation was accepted — blank is internal to description
      if (hadBlank) {
        self.containerState!.hadBlankInDescription = true;
      }
      return ok(code);
    }
  }

  function notInCurrentItem(code: number | null): State | undefined {
    self.containerState!._closeFlow = true;
    // interrupt is set by the micromark runtime on TokenizeContext
    (self as unknown as { interrupt: boolean | undefined }).interrupt = undefined;
    return factorySpace(
      effects,
      effects.attempt(defListConstruct, ok, nok),
      "linePrefix",
      self.parser.constructs.disable.null?.includes("codeIndented") ? undefined : 4,
    )(code);
  }
}

function tokenizeIndent(this: TokenizeContext, effects: Effects, ok: State, nok: State): State {
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const self = this;
  return factorySpace(effects, afterPrefix, "linePrefix", self.containerState!.size! + 1);

  function afterPrefix(code: number | null): State | undefined {
    const tail = self.events[self.events.length - 1];
    return tail &&
      tail[1].type === "linePrefix" &&
      tail[2].sliceSerialize(tail[1], true).length === self.containerState!.size
      ? ok(code)
      : nok(code);
  }
}

function tokenizeDefListDescriptionPrefixWhitespace(
  this: TokenizeContext,
  effects: Effects,
  ok: State,
  nok: State,
): State {
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const self = this;
  return factorySpace(
    effects,
    afterPrefix,
    tokenTypes.defListDescriptionPrefixWhitespace,
    self.parser.constructs.disable.null?.includes("codeIndented") ? undefined : 4 + 1,
  );

  function afterPrefix(code: number | null): State | undefined {
    const tail = self.events[self.events.length - 1];
    return !markdownSpace(code) &&
      tail &&
      tail[1].type === tokenTypes.defListDescriptionPrefixWhitespace
      ? ok(code)
      : nok(code);
  }
}

function tokenizeDefListEnd(this: TokenizeContext, effects: Effects): void {
  const defListToken = effects.exit(tokenTypes.defList);
  if (this.containerState?.hadBlankInDescription) {
    (defListToken as FlowToken)._prevLoose = true;
    this.containerState.hadBlankInDescription = undefined;
  }
}
