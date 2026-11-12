// markdown-it block state subclassing requires casting state.constructor; no narrower type exists.
/* oxlint-disable typescript/no-unsafe-type-assertion */
import type { PluginWithOptions } from "markdown-it";
import type StateBlock from "markdown-it/lib/rules_block/state_block.mjs";
import type Token from "markdown-it/lib/token.mjs";
import { isAlertMarkerLine } from "@mirrordown/core";
import type { StepsOptions } from "./types.js";

export type { StepsOptions };

// Matches: @{1-6 @s}{digits}. {optional title}
// Groups: 1=raw @ string (depth indicator), 2=number, 3=title text
const STEP_HEADER_RE = /^(@{1,6})(\d+)\. ?(.*)/;

// Matches: > or ><space> continuation line
const CONTINUATION_RE = /^> ?/;

// A second `>` after the body's own: the line is a quote in the body.
const NESTED_QUOTE_RE = /^>[ \t]*>/;

interface StepFrame {
  depth: number;
  number: number;
  title: string;
  // The body's lines without their `>` marker; `null` for a blank line written without one, which ends the blocks before it as it ends a blockquote.
  bodyLines: Array<string | null>;
}

interface StepsBlock {
  frames: StepFrame[];
  // map of depth -> counter (1-based, auto-incremented)
  counters: Map<number, number>;
  currentDepth: number;
}

const parseStepHeader = (
  line: string
): { depth: number; number: number; title: string } | null => {
  const m = STEP_HEADER_RE.exec(line);
  if (!m) return null;
  // Spaces after the title are not part of it (two or more would be a hard break in a paragraph; a header is one line).
  return {
    depth: m[1].length,
    number: parseInt(m[2], 10),
    title: m[3].trimEnd()
  };
};

// The marker takes one column of a tab after it, as it takes a space; the tab's other two columns stay as indentation, so the line isn't read as indented code.
const stripContinuation = (line: string): string =>
  line.startsWith(">\t")
    ? `  ${line.slice(2)}`
    : line.replace(CONTINUATION_RE, "");

// An alert (`> [!NOTE]`) written with the body's own marker. Deeper (`> > [!NOTE]`), it's an alert in the body.
const isOwnAlertLine = (line: string): boolean =>
  isAlertMarkerLine(line) && !NESTED_QUOTE_RE.test(line);

/** markdown-it plugin for numbered step sequences, rendering ordered step lists. */
export const steps: PluginWithOptions<StepsOptions> = (md, options = {}) => {
  const { containerClass = "markdown-steps" } = options;

  md.block.ruler.before("blockquote", "steps", stepsRule, {
    alt: ["paragraph", "reference"]
  });

  // A title that held only an attribute block is empty once attrs has taken the block for the step: it renders nothing, like a step written without a title. The check is made when rendering because attrs runs after this rule, whichever plugin is installed first.
  const isEmptied = (inline: Token | undefined): boolean =>
    inline?.type === "inline" &&
    (inline.children ?? []).every(
      (child) => child.type === "text" && child.content === ""
    );
  md.renderer.rules.steps_title_open = (
    tokens,
    idx,
    opts,
    _env,
    self
  ): string =>
    isEmptied(tokens[idx + 1]) ? "" : self.renderToken(tokens, idx, opts);
  md.renderer.rules.steps_title_close = (
    tokens,
    idx,
    opts,
    _env,
    self
  ): string =>
    isEmptied(tokens[idx - 1]) ? "" : self.renderToken(tokens, idx, opts);

  function stepsRule(
    state: StateBlock,
    startLine: number,
    endLine: number,
    silent: boolean
  ): boolean {
    const pos = state.bMarks[startLine] + state.tShift[startLine];
    const max = state.eMarks[startLine];
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
      currentDepth: 0
    };

    let currentFrame: StepFrame | null = null;
    let nextLine = startLine;

    const flushFrame = (): void => {
      if (currentFrame) block.frames.push(currentFrame);
      currentFrame = null;
    };

    while (nextLine < endLine) {
      const linePos = state.bMarks[nextLine] + state.tShift[nextLine];
      const lineMax = state.eMarks[nextLine];
      const line = state.src.slice(linePos, lineMax);

      const header = parseStepHeader(line);
      if (header) {
        const { depth, title } = header;

        // No depth jumps â€” depth can only be currentDepth+1 or <=currentDepth
        if (depth > block.currentDepth + 1) break;

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
            // End of input â€” block terminates here
            break;
          }
          const peekPos = state.bMarks[peek] + state.tShift[peek];
          const peekMax = state.eMarks[peek];
          const peekLine = state.src.slice(peekPos, peekMax);
          // An alert after a blank line is a block of its own, not more of the step's body. A line written outside the block the steps are in (a list item) ends that block after a blank line, and the steps with it.
          const isContinuation =
            state.sCount[peek] >= state.blkIndent &&
            ((CONTINUATION_RE.test(peekLine) && !isOwnAlertLine(peekLine)) ||
              parseStepHeader(peekLine) !== null);
          if (!isContinuation) break;
          // Blank line is part of the body
          currentFrame.bodyLines.push(null);
          nextLine++;
          continue;
        }

        // A `>` line written outside the block the steps are in (a list item) is a blockquote after that block, as CommonMark reads it, not more of the body. A header there still continues the steps: CommonMark continues the body's paragraph with it, which is how the other engines find it.
        if (
          CONTINUATION_RE.test(line) &&
          state.sCount[nextLine] >= state.blkIndent
        ) {
          currentFrame.bodyLines.push(stripContinuation(line));
          nextLine++;
          continue;
        }
      }

      // Line is neither a header nor a continuation â€” block ends
      break;
    }

    flushFrame();

    if (block.frames.length === 0) return false;

    state.line = nextLine;

    // Emit tokens
    emitStepsTokens(
      state,
      block.frames,
      startLine,
      nextLine - 1,
      containerClass
    );

    return true;
  }

  function emitStepsTokens(
    state: StateBlock,
    frames: StepFrame[],
    startLine: number,
    endLine: number,
    containerClass: string
  ): void {
    emitFrames(state, frames, 0, containerClass, startLine, endLine);
  }

  function emitFrames(
    state: StateBlock,
    frames: StepFrame[],
    parentDepth: number,
    containerClass: string,
    mapStart?: number,
    mapEnd?: number
  ): void {
    const targetDepth = parentDepth + 1;

    // Collect frames at this depth level in order, grouped by parent
    let i = 0;
    while (i < frames.length) {
      const frame = frames[i];
      if (frame.depth !== targetDepth) {
        i++;
        continue;
      }

      // Collect all frames at this depth and deeper until depth drops back
      const group: StepFrame[] = [];
      let j = i;
      while (j < frames.length) {
        if (frames[j].depth < targetDepth) break;
        group.push(frames[j]);
        j++;
      }

      // Emit <ol> â€” top-level list gets containerClass, nested lists get containerClass-list
      const olOpen = state.push("steps_list_open", "ol", 1);
      olOpen.attrSet(
        "class",
        targetDepth === 1 ? containerClass : `${containerClass}-list`
      );
      if (mapStart !== undefined && mapEnd !== undefined)
        olOpen.map = [mapStart, mapEnd];
      olOpen.block = true;
      olOpen.meta = { attrsRole: "container" };

      // Emit each <li> at targetDepth within group
      let k = 0;
      while (k < group.length) {
        const f = group[k];
        if (f.depth !== targetDepth) {
          k++;
          continue;
        }

        const liOpen = state.push("steps_item_open", "li", 1);
        liOpen.attrSet("class", `${containerClass}-item`);
        liOpen.attrSet("data-step", String(f.number));
        liOpen.block = true;
        liOpen.meta = { attrsRole: "containerItem" };

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

        // Step body â€” parse as nested block content
        // Blank lines alone (between two headers, or a lone `>`) are not a body.
        if (f.bodyLines.some((line) => line !== null && line.trim() !== "")) {
          const bodyOpen = state.push("steps_body_open", "div", 1);
          bodyOpen.attrSet("class", `${containerClass}-body`);
          bodyOpen.block = true;

          const bodyContent = f.bodyLines.map((line) => line ?? "").join("\n");
          // The `attrsSource` protocol: the body is tokenized from its own text, so the `map` of every token between this one and its close indexes the lines of `attrsSource` (the body without its `>` markers), not the document's. A rule that reads a body token's lines must take them from here, as attrs and caption do; `map` alone points at the wrong document lines.
          bodyOpen.meta = { attrsSource: bodyContent };

          // Tokenize the body content by creating a child state. The body's last line ends with a line ending, as every line of a blockquote's content does: a fence the end of the body closes keeps its last line's.
          const childState = new (state.constructor as typeof StateBlock)(
            `${bodyContent}\n`,
            state.md,
            state.env,
            state.tokens
          );
          // Body tokens nest inside the list, item and body tokens, so core rules that only act at the top level (such as sectionize) leave them alone.
          childState.level = state.level;
          // A blank line written without the body's `>` ends the blocks before it, as CommonMark ends a blockquote there (the other engines get two blockquotes). So each run of lines between such blank lines is tokenized on its own: a list or a fence doesn't continue across one.
          let runStart = 0;
          for (let l = 0; l <= f.bodyLines.length; l++) {
            if (l < f.bodyLines.length && f.bodyLines[l] !== null) continue;
            if (l > runStart) {
              childState.lineMax = l;
              childState.md.block.tokenize(childState, runStart, l);
            }
            runStart = l + 1;
          }

          state.push("steps_body_close", "div", -1);
        }

        // Find child frames (depth > targetDepth) that belong to this item
        // They appear between this item (k) and the next targetDepth item
        const childStart = k + 1;
        let childEnd = childStart;
        while (childEnd < group.length && group[childEnd].depth > targetDepth)
          childEnd++;
        const children = group.slice(childStart, childEnd);

        if (children.length > 0) {
          emitFrames(state, children, targetDepth, containerClass);
        }

        state.push("steps_item_close", "li", -1);
        k = childEnd;
      }

      const olClose = state.push("steps_list_close", "ol", -1);
      olClose.meta = { attrsRole: "container" };

      i = j;
    }
  }
};
