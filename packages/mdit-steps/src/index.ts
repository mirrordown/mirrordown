import type { PluginWithOptions } from "markdown-it";
import StateBlock from "markdown-it/lib/rules_block/state_block.mjs";
import type { StepsOptions } from "./types.js";

export type { StepsOptions };

// Matches: @{1-6 @s}{digits}. {optional title}
// Groups: 1=raw @ string (depth indicator), 2=number, 3=title text
const STEP_HEADER_RE = /^(@{1,6})(\d+)\. ?(.*)/;

// Matches: | or |<space> continuation line
const CONTINUATION_RE = /^\| ?/;

interface StepFrame {
  depth: number;
  number: number;
  title: string;
  bodyLines: string[];
}

interface StepsBlock {
  frames: StepFrame[];
  // map of depth -> counter (1-based, auto-incremented)
  counters: Map<number, number>;
  currentDepth: number;
}

const parseStepHeader = (line: string): { depth: number; number: number; title: string } | null => {
  const m = STEP_HEADER_RE.exec(line);
  if (!m) return null;
  return { depth: m[1]!.length, number: parseInt(m[2]!, 10), title: m[3]! };
};

const stripContinuation = (line: string): string => line.replace(CONTINUATION_RE, "");

export const steps: PluginWithOptions<StepsOptions> = (md, options = {}) => {
  const { containerClass = "markdown-steps" } = options;

  md.block.ruler.before("blockquote", "steps", stepsRule, { alt: ["paragraph", "reference"] });

  function stepsRule(
    state: StateBlock,
    startLine: number,
    endLine: number,
    silent: boolean,
  ): boolean {
    const pos = state.bMarks[startLine]! + state.tShift[startLine]!;
    const max = state.eMarks[startLine]!;
    const lineText = state.src.slice(pos, max);

    // Must start with a step header
    const firstHeader = parseStepHeader(lineText);
    if (!firstHeader) return false;
    // First line must be depth 1
    if (firstHeader.depth !== 1) return false;

    if (silent) return true;

    // Collect all lines belonging to this steps block
    const block: StepsBlock = {
      frames: [],
      counters: new Map(),
      currentDepth: 0,
    };

    let currentFrame: StepFrame | null = null;
    let nextLine = startLine;

    const flushFrame = () => {
      if (currentFrame) block.frames.push(currentFrame);
      currentFrame = null;
    };

    while (nextLine < endLine) {
      const linePos = state.bMarks[nextLine]! + state.tShift[nextLine]!;
      const lineMax = state.eMarks[nextLine]!;
      const line = state.src.slice(linePos, lineMax);

      const header = parseStepHeader(line);
      if (header) {
        const { depth, title } = header;

        // No depth jumps — depth can only be currentDepth+1 or <=currentDepth
        if (depth > block.currentDepth + 1) break;

        // Validate: going deeper is only +1
        if (depth > block.currentDepth && depth !== block.currentDepth + 1) break;

        // Reset counters for all depths deeper than this one
        for (const k of block.counters.keys()) {
          if (k > depth) block.counters.delete(k);
        }

        const prev = block.counters.get(depth) ?? 0;
        const number = prev + 1;
        block.counters.set(depth, number);
        block.currentDepth = depth;

        flushFrame();
        currentFrame = { depth, number, title, bodyLines: [] };
        nextLine++;
        continue;
      }

      // Continuation line (| or blank that belongs to a body)
      if (currentFrame !== null) {
        // A blank line is a continuation only if a subsequent non-blank line resumes with | or @
        if (state.isEmpty(nextLine)) {
          // Lookahead: find next non-blank line
          let peek = nextLine + 1;
          while (peek < endLine && state.isEmpty(peek)) peek++;
          if (peek >= endLine) {
            // End of input — block terminates here
            break;
          }
          const peekPos = state.bMarks[peek]! + state.tShift[peek]!;
          const peekMax = state.eMarks[peek]!;
          const peekLine = state.src.slice(peekPos, peekMax);
          const isContinuation =
            CONTINUATION_RE.test(peekLine) || parseStepHeader(peekLine) !== null;
          if (!isContinuation) break;
          // Blank line is part of the body
          currentFrame.bodyLines.push("");
          nextLine++;
          continue;
        }

        if (CONTINUATION_RE.test(line)) {
          currentFrame.bodyLines.push(stripContinuation(line));
          nextLine++;
          continue;
        }
      }

      // Line is neither a header nor a continuation — block ends
      break;
    }

    flushFrame();

    if (block.frames.length === 0) return false;

    state.line = nextLine;

    // Emit tokens
    emitStepsTokens(state, block.frames, startLine, nextLine - 1, containerClass);

    return true;
  }

  function emitStepsTokens(
    state: StateBlock,
    frames: StepFrame[],
    startLine: number,
    endLine: number,
    containerClass: string,
  ): void {
    emitFrames(state, frames, 0, containerClass, startLine, endLine);
  }

  function emitFrames(
    state: StateBlock,
    frames: StepFrame[],
    parentDepth: number,
    containerClass: string,
    mapStart?: number,
    mapEnd?: number,
  ): void {
    const targetDepth = parentDepth + 1;

    // Collect frames at this depth level in order, grouped by parent
    let i = 0;
    while (i < frames.length) {
      const frame = frames[i]!;
      if (frame.depth !== targetDepth) {
        i++;
        continue;
      }

      // Collect all frames at this depth and deeper until depth drops back
      const group: StepFrame[] = [];
      let j = i;
      while (j < frames.length) {
        if (frames[j]!.depth < targetDepth) break;
        group.push(frames[j]!);
        j++;
      }

      // Emit <ol> — top-level list gets containerClass, nested lists get containerClass-list
      const olOpen = state.push("steps_list_open", "ol", 1);
      olOpen.attrSet("class", targetDepth === 1 ? containerClass : `${containerClass}-list`);
      if (mapStart !== undefined && mapEnd !== undefined) olOpen.map = [mapStart, mapEnd];
      olOpen.block = true;
      olOpen.meta = { attrsRole: "list" };

      // Emit each <li> at targetDepth within group
      let k = 0;
      while (k < group.length) {
        const f = group[k]!;
        if (f.depth !== targetDepth) {
          k++;
          continue;
        }

        const liOpen = state.push("steps_item_open", "li", 1);
        liOpen.attrSet("class", `${containerClass}-item`);
        liOpen.attrSet("data-step", String(f.number));
        liOpen.block = true;
        liOpen.meta = { attrsRole: "listItem" };

        // Step title
        if (f.title.trim()) {
          const titleOpen = state.push("steps_title_open", "p", 1);
          titleOpen.attrSet("class", `${containerClass}-title`);
          titleOpen.meta = { attrsItemTitle: true };

          const titleInline = state.push("inline", "", 0);
          titleInline.content = f.title;
          titleInline.children = [];

          state.push("steps_title_close", "p", -1);
        }

        // Step body — parse as nested block content
        if (f.bodyLines.length > 0) {
          const bodyOpen = state.push("steps_body_open", "div", 1);
          bodyOpen.attrSet("class", `${containerClass}-body`);
          bodyOpen.block = true;

          const bodyContent = f.bodyLines.join("\n");
          const oldBullet = state.parentType;
          state.parentType = "blockquote" as typeof state.parentType;
          const oldLineMax = state.lineMax;

          // Tokenize the body content by creating a child state
          const childState = new (state.constructor as typeof StateBlock)(
            bodyContent,
            state.md,
            state.env,
            state.tokens,
          );
          childState.md.block.tokenize(childState, 0, childState.lineMax);

          state.parentType = oldBullet;
          state.lineMax = oldLineMax;

          state.push("steps_body_close", "div", -1);
        }

        // Find child frames (depth > targetDepth) that belong to this item
        // They appear between this item (k) and the next targetDepth item
        const childStart = k + 1;
        let childEnd = childStart;
        while (childEnd < group.length && group[childEnd]!.depth > targetDepth) childEnd++;
        const children = group.slice(childStart, childEnd);

        if (children.length > 0) {
          emitFrames(state, children, targetDepth, containerClass);
        }

        state.push("steps_item_close", "li", -1);
        k = childEnd;
      }

      const olClose = state.push("steps_list_close", "ol", -1);
      olClose.meta = { attrsRole: "list" };

      i = j;
    }
  }
};
