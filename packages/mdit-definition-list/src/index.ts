import type { PluginSimple } from "markdown-it";
import type { RuleBlock } from "markdown-it/lib/parser_block.mjs";
import type StateBlock from "markdown-it/lib/rules_block/state_block.mjs";

const COLON = 58;
const TILDE = 126;
const SPACE = 32;
const TAB = 9;
const TAB_SIZE = 4;

const expandTabStop = (offset: number): number =>
  offset + TAB_SIZE - (offset % TAB_SIZE);

// Search `[:~][\n ]`, returns next pos after marker on success or -1 on fail.
const checkAndSkipMarker = (state: StateBlock, line: number): number => {
  let start = state.bMarks[line] + state.tShift[line];
  const max = state.eMarks[line];

  if (start >= max) return -1;

  // Four or more columns past the block's indent is indented code or a paragraph continuation, never a marker
  if (state.sCount[line] - state.blkIndent >= 4) return -1;

  const marker = state.src.charCodeAt(start++);
  if (marker !== TILDE && marker !== COLON) return -1;

  // skip spaces and tabs after marker
  let pos = start;
  while (pos < max) {
    const ch = state.src.charCodeAt(pos);
    if (ch !== SPACE && ch !== TAB) break;
    pos++;
  }

  // require a space/tab after the marker unless it ends the line (`:tada:` is text)
  if (pos < max && start === pos) return -1;

  return start;
};

// Saves mutable state fields, calls body, then restores them.
const withStateIsolation = (
  state: StateBlock,
  ddLine: number,
  contentStart: number,
  offset: number,
  indent: number,
  endLine: number,
  body: () => void
): void => {
  const savedTight = state.tight;
  const savedDDIndent = state.ddIndent;
  const savedIndent = state.blkIndent;
  const savedTShift = state.tShift[ddLine];
  const savedSCount = state.sCount[ddLine];
  const savedParentType = state.parentType;

  state.blkIndent = state.ddIndent = indent;
  state.tShift[ddLine] = contentStart - state.bMarks[ddLine];
  state.sCount[ddLine] = offset;
  state.tight = true;
  // @ts-expect-error: This type is not standard
  state.parentType = "dl";
  // @ts-expect-error: An internal param is used
  state.md.block.tokenize(state, ddLine, endLine, true);

  body();

  state.tShift[ddLine] = savedTShift;
  state.sCount[ddLine] = savedSCount;
  state.tight = savedTight;
  state.parentType = savedParentType;
  state.blkIndent = savedIndent;
  state.ddIndent = savedDDIndent;
};

// Hide the paragraphs directly inside the dd opened at `index`, like a tight list item.
const markTightParagraphs = (state: StateBlock, index: number): void => {
  const level = state.tokens[index].level + 1;

  for (let i = index + 1, length = state.tokens.length - 2; i < length; i++) {
    if (
      state.tokens[i].level === level &&
      state.tokens[i].type === "paragraph_open"
    ) {
      state.tokens[i + 2].hidden = true;
      state.tokens[i].hidden = true;
      i += 2;
    }
  }
};

// The first term is a paragraph start for free: every rule registered ahead of this one has already declined its line. A later term is read inside the loop, so the same rules are asked here, in validation mode, whether the line starts a block of theirs (a heading, fence, list item, thematic break, ...). A rule that ignores validation mode (`code` does) may push tokens or move the line, so both are put back.
const startsAnotherBlock = (
  state: StateBlock,
  line: number,
  endLine: number
): boolean => {
  const tokenCount = state.tokens.length;
  const savedLine = state.line;
  const savedLevel = state.level;
  let found = false;

  for (const rule of state.md.block.ruler.getRules("")) {
    if (rule === dlRule) break;
    if (rule(state, line, endLine, true)) {
      found = true;
      break;
    }
  }

  state.tokens.length = tokenCount;
  state.line = savedLine;
  state.level = savedLevel;

  return found;
};

const dlRule: RuleBlock = (state, startLine, endLine, silent) => {
  if (silent) {
    // validation mode validates a dd block only, not a whole definition list
    if (state.ddIndent < 0) return false;

    return (
      checkAndSkipMarker(state, startLine) >= 0 &&
      state.sCount[startLine] < state.blkIndent
    );
  }

  let nextLine = startLine + 1;

  if (nextLine >= endLine) return false;

  let hasSkippedEmptyLines = false;

  if (state.isEmpty(nextLine)) {
    nextLine++;
    hasSkippedEmptyLines = true;
    if (nextLine >= endLine) return false;
  }

  if (state.sCount[nextLine] < state.blkIndent) return false;

  let contentStart = checkAndSkipMarker(state, nextLine);

  if (contentStart < 0) return false;

  // Start list
  const dlOpenToken = state.push("dl_open", "dl", 1);
  const listLines: [start: number, end: number] = [startLine, 0];

  dlOpenToken.map = listLines;
  dlOpenToken.meta = { attrsRole: "container" };

  //
  // Iterate list items
  //

  let dtLine = startLine;
  let ddLine = nextLine;
  // A definition is loose when a blank line precedes its own marker
  let blankBeforeMarker = hasSkippedEmptyLines;

  // One definition list can contain multiple DTs,
  // and one DT can be followed by multiple DDs.
  //
  // Thus, there is two loops here, and label is
  // needed to break out of the second one
  //
  // oxlint-disable-next-line no-labels
  OUTER: for (;;) {
    const dtOpenToken = state.push("dt_open", "dt", 1);

    dtOpenToken.map = [dtLine, dtLine];
    dtOpenToken.meta = { attrsRole: "containerItem", attrsItemTitle: true };

    const inlineToken = state.push("inline", "", 0);

    inlineToken.map = [dtLine, dtLine];
    inlineToken.content = state
      .getLines(dtLine, dtLine + 1, state.blkIndent, false)
      .trim();
    inlineToken.children = [];

    state.push("dt_close", "dt", -1);

    for (;;) {
      const ddTokenIndex = state.tokens.length;
      const ddOpenToken = state.push("dd_open", "dd", 1);
      const itemLines: [start: number, end: number] = [nextLine, 0];

      ddOpenToken.map = itemLines;

      let pos = contentStart;
      const max = state.eMarks[ddLine];
      let offset =
        state.sCount[ddLine] +
        contentStart -
        (state.bMarks[ddLine] + state.tShift[ddLine]);

      while (pos < max) {
        const ch = state.src.charCodeAt(pos);

        if (ch === TAB) offset = expandTabStop(offset);
        else if (ch === SPACE) offset++;
        else break;

        pos++;
      }

      // Continuation lines belong to the definition when indented to its
      // content column, as with a list item: one column past the marker plus
      // the spaces after it, or just one space when the marker ends the line
      // or more than four follow (the rest is then an indented code block).
      const afterMarker = state.sCount[ddLine] + 1;
      const spacesAfterMarker = pos >= max ? 1 : offset - afterMarker;
      const indent =
        afterMarker + (spacesAfterMarker > 4 ? 1 : spacesAfterMarker);

      contentStart = pos;

      let loose = blankBeforeMarker;

      withStateIsolation(
        state,
        ddLine,
        contentStart,
        offset,
        indent,
        endLine,
        () => {
          // ...or when a blank line separates blocks inside it
          if (!state.tight) loose = true;
          // A trailing blank line loosens the next definition of this term, if any
          blankBeforeMarker =
            state.line - ddLine > 1 && state.isEmpty(state.line - 1);
        }
      );

      if (!loose) markTightParagraphs(state, ddTokenIndex);

      state.push("dd_close", "dd", -1);

      itemLines[1] = nextLine = state.line;

      // oxlint-disable-next-line no-labels
      if (nextLine >= endLine) break OUTER;

      // oxlint-disable-next-line no-labels
      if (state.sCount[nextLine] < state.blkIndent) break OUTER;

      contentStart = checkAndSkipMarker(state, nextLine);

      if (contentStart < 0) break;

      ddLine = nextLine;

      // go to the next loop iteration:
      // insert DD tag and repeat checking
    }

    dtLine = nextLine;
    ddLine = dtLine + 1;

    if (ddLine >= endLine) break;

    blankBeforeMarker = state.isEmpty(ddLine);

    if (blankBeforeMarker) ddLine++;

    if (ddLine >= endLine || state.sCount[ddLine] < state.blkIndent) break;

    contentStart = checkAndSkipMarker(state, ddLine);

    if (contentStart < 0) break;

    if (startsAnotherBlock(state, dtLine, endLine)) break;

    // go to the next loop iteration:
    // insert DT and DD tags and repeat checking
  }

  // Finalize list
  const dlCloseToken = state.push("dl_close", "dl", -1);
  dlCloseToken.meta = { attrsRole: "container" };

  listLines[1] = nextLine;

  state.line = nextLine;

  return true;
};

/** markdown-it plugin for definition lists, rendering `<dl>`, `<dt>`, and `<dd>` elements. */
export const dl: PluginSimple = (md) => {
  // Ahead of `lheading`, which would otherwise read `Term` / `: Def` / `===` as a setext heading: it scans past the marker line because this rule only terminates paragraphs inside a definition
  md.block.ruler.before("lheading", "dl", dlRule, {
    alt: ["paragraph", "reference", "blockquote"]
  });
};
