import { splice } from "micromark-util-chunked";
import type { Event, Token, TokenizeContext } from "micromark-util-types";
import { tokenTypes } from "./types.js";
import type { FlowToken } from "./types.js";

type EventTuple = [string, Token, TokenizeContext];

export function analyzeDefTermFlow(flowToken: FlowToken): {
  flowEvents: EventTuple[];
  paragraph?: { enterIndex: number; exitIndex: number; startOffset: number };
} {
  const flowEvents = flowToken._tokenizer!.events as EventTuple[];
  let paraEnterIndex: number | undefined;
  let paraExitIndex: number | undefined;
  let paraStartOffset: number | undefined;

  for (let i = flowEvents.length - 1; i >= 0; i--) {
    const tmpEvent = flowEvents[i];
    if (tmpEvent[1].type === "paragraph") {
      if (tmpEvent[0] === "exit") {
        paraExitIndex = i;
      } else {
        paraEnterIndex = i;
        paraStartOffset = tmpEvent[1].start.offset;
        for (let j = i - 1; j >= 0; j--) {
          const e = flowEvents[j];
          if (e[1].type === "content") continue;
          if (e[1].type === "linePrefix") {
            paraStartOffset = e[1].start.offset;
            break;
          }
          break;
        }
        break;
      }
    }
  }

  if (paraEnterIndex != null && paraExitIndex != null && paraStartOffset != null) {
    return {
      flowEvents,
      paragraph: {
        enterIndex: paraEnterIndex,
        exitIndex: paraExitIndex,
        startOffset: paraStartOffset,
      },
    };
  }
  return { flowEvents };
}

function getSubtokensForDefTerm(termFlowToken: FlowToken): {
  leadingChildEvents: EventTuple[];
  termChildEvents: EventTuple[];
  trailingChildEvents: EventTuple[];
} {
  const flowEvents = termFlowToken._tokenizer!.events as EventTuple[];
  const leadingChildEvents: EventTuple[] = [];
  const trailingChildEvents: EventTuple[] = [];
  const termChildEvents: EventTuple[] = [];
  const removedEventIndexes: number[] = [];

  let pEnterIndex: number | undefined;
  let pExitIndex: number | undefined;
  let contentEnterIndex: number | undefined;
  let contentExitIndex: number | undefined;
  const paragraphEvents: EventTuple[] = [];
  const contentEvents: EventTuple[] = [];

  for (let i = flowEvents.length - 1; i >= 0; i--) {
    const tmpEvent = flowEvents[i];
    const tmpToken = tmpEvent[1];

    if (tmpToken.start.offset >= termFlowToken.end.offset) {
      removedEventIndexes.push(i);
      continue;
    }

    switch (tmpToken.type) {
      case "paragraph":
        if (pEnterIndex == null && tmpEvent[0] === "enter") pEnterIndex = i;
        else if (pExitIndex == null && tmpEvent[0] === "exit") pExitIndex = i;
        break;
      case "content":
        if (tmpEvent[0] === "enter") contentEnterIndex = i;
        else if (tmpEvent[0] === "exit") contentExitIndex = i;
        break;
      default:
        if (
          termFlowToken.start.offset <= tmpToken.start.offset &&
          tmpToken.end.offset <= termFlowToken.end.offset
        ) {
          if (tmpToken.type === "chunkText") {
            const chunkToken = tmpToken as FlowToken;
            if (
              chunkToken.previous &&
              chunkToken.previous.start.offset < termFlowToken.start.offset
            ) {
              chunkToken.previous.next = undefined;
              chunkToken.previous = undefined;
            }
            if (chunkToken.next && termFlowToken.end.offset < chunkToken.next.end.offset) {
              chunkToken.next.previous = undefined;
              chunkToken.next = undefined;
            }
          }
          if (pEnterIndex == null && pExitIndex == null) trailingChildEvents.unshift(tmpEvent);
          else if (pEnterIndex == null && pExitIndex != null) termChildEvents.unshift(tmpEvent);
          else leadingChildEvents.unshift(tmpEvent);
          removedEventIndexes.push(i);
        } else {
          if (pEnterIndex == null && pExitIndex != null) paragraphEvents.unshift(tmpEvent);
          if (contentEnterIndex == null && contentExitIndex != null)
            contentEvents.unshift(tmpEvent);
        }
    }

    if (tmpToken.end.offset <= termFlowToken.start.offset) break;
  }

  if (pExitIndex != null) {
    if (paragraphEvents.length >= 1) {
      flowEvents[pExitIndex][1].end = Object.assign(
        {},
        paragraphEvents[paragraphEvents.length - 1][1].end,
      );
    } else if (pEnterIndex != null) {
      removedEventIndexes.push(pEnterIndex, pExitIndex);
    }
  }

  if (contentExitIndex != null) {
    if (contentEvents.length >= 1) {
      flowEvents[contentExitIndex][1].end = Object.assign(
        {},
        contentEvents[contentEvents.length - 1][1].end,
      );
    } else if (contentEnterIndex != null) {
      removedEventIndexes.push(contentEnterIndex, contentExitIndex);
    }
  }

  removedEventIndexes.sort((a, b) => b - a);
  for (const i of removedEventIndexes) {
    splice(flowEvents as Event[], i, 1, []);
  }

  return { leadingChildEvents, termChildEvents, trailingChildEvents };
}

export function subtokenizeDefTerm(
  events: EventTuple[],
  flowEnterIndex: number,
  flowExitIndex: number | undefined,
): EventTuple[] {
  const termFlowToken = events[flowEnterIndex][1] as FlowToken;

  if (termFlowToken.previous != null) {
    termFlowToken.previous.next = undefined;
    termFlowToken.previous = undefined;
  }

  const subtokens = getSubtokensForDefTerm(termFlowToken);
  const context = events[flowExitIndex!][2];
  const childEvents: EventTuple[] = [];
  const numOfChildren = subtokens.termChildEvents.length;

  if (numOfChildren > 0) {
    const termToken: Token = {
      type: tokenTypes.defListTerm,
      start: Object.assign({}, termFlowToken.start),
      end: Object.assign({}, termFlowToken.end),
    };
    childEvents.push(["enter", termToken, context]);
    childEvents.push(...subtokens.leadingChildEvents);
    childEvents.push(...subtokens.termChildEvents);
    childEvents.push(...subtokens.trailingChildEvents);
    childEvents.push(["exit", termToken, context]);
  } else {
    childEvents.push(...subtokens.leadingChildEvents);
    childEvents.push(...subtokens.trailingChildEvents);
  }

  splice(events as Event[], flowExitIndex!, 1, []);
  splice(events as Event[], flowEnterIndex, 1, childEvents as Event[]);
  return events;
}
