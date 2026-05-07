import type { PluginSimple } from "markdown-it";
import type { RuleBlock } from "markdown-it/lib/parser_block.mjs";
import type StateBlock from "markdown-it/lib/rules_block/state_block.mjs";

const COLON = 58;
const TILDE = 126;
const SPACE = 32;
const TAB = 9;
const TAB_SIZE = 4;

const expandTabStop = (offset: number) => offset + TAB_SIZE - (offset % TAB_SIZE);

// Search `[:~][\n ]`, returns next pos after marker on success or -1 on fail.
const checkAndSkipMarker = (state: StateBlock, line: number): number => {
  let start = state.bMarks[line] + state.tShift[line];
  const max = state.eMarks[line];

  if (start >= max) return -1;

  const marker = state.src.charCodeAt(start++);
  if (marker !== TILDE && marker !== COLON) return -1;

  // skip spaces and tabs after marker
  let pos = start;
  while (pos < max) {
    const ch = state.src.charCodeAt(pos);
    if (ch !== SPACE && ch !== TAB) break;
    pos++;
  }

  // require at least one space/tab after marker, and non-empty content
  if (start === pos || pos >= max) return -1;

  return start;
};

// Saves mutable state fields, calls body, then restores them.
const withStateIsolation = (
  state: StateBlock,
  ddLine: number,
  contentStart: number,
  offset: number,
  endLine: number,
  body: () => void,
): void => {
  const savedTight = state.tight;
  const savedDDIndent = state.ddIndent;
  const savedIndent = state.blkIndent;
  const savedTShift = state.tShift[ddLine];
  const savedSCount = state.sCount[ddLine];
  const savedParentType = state.parentType;

  state.blkIndent = state.ddIndent = state.sCount[ddLine] + 2;
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

const markTightParagraphs = (state: StateBlock, index: number): void => {
  const level = state.level + 2;

  for (let i = index + 2, length = state.tokens.length - 2; i < length; i++) {
    if (state.tokens[i].level === level && state.tokens[i].type === "paragraph_open") {
      state.tokens[i + 2].hidden = true;
      state.tokens[i].hidden = true;
      i += 2;
    }
  }
};

const dlRule: RuleBlock = (state, startLine, endLine, silent) => {
  if (silent) {
    // validation mode validates a dd block only, not a whole definition list
    if (state.ddIndent < 0) return false;

    return checkAndSkipMarker(state, startLine) >= 0 && state.sCount[startLine] < state.blkIndent;
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
  const listTokenIndex = state.tokens.length;

  const dlOpenToken = state.push("dl_open", "dl", 1);
  const listLines: [start: number, end: number] = [startLine, 0];

  dlOpenToken.map = listLines;
  dlOpenToken.meta = { attrsRole: "container" };

  //
  // Iterate list items
  //

  let dtLine = startLine;
  let ddLine = nextLine;
  let tight = !hasSkippedEmptyLines;

  // One definition list can contain multiple DTs,
  // and one DT can be followed by multiple DDs.
  //
  // Thus, there is two loops here, and label is
  // needed to break out of the second one
  //
  // oxlint-disable-next-line no-labels
  OUTER: for (;;) {
    let prevEmptyEnd = false;

    const dtOpenToken = state.push("dt_open", "dt", 1);

    dtOpenToken.map = [dtLine, dtLine];
    dtOpenToken.meta = { attrsRole: "containerItem", attrsItemTitle: true };

    const inlineToken = state.push("inline", "", 0);

    inlineToken.map = [dtLine, dtLine];
    inlineToken.content = state.getLines(dtLine, dtLine + 1, state.blkIndent, false).trim();
    inlineToken.children = [];

    state.push("dt_close", "dt", -1);

    for (;;) {
      const ddOpenToken = state.push("dd_open", "dd", 1);
      const itemLines: [start: number, end: number] = [nextLine, 0];

      ddOpenToken.map = itemLines;

      let pos = contentStart;
      const max = state.eMarks[ddLine];
      let offset =
        state.sCount[ddLine] + contentStart - (state.bMarks[ddLine] + state.tShift[ddLine]);

      while (pos < max) {
        const ch = state.src.charCodeAt(pos);

        if (ch === TAB) offset = expandTabStop(offset);
        else if (ch === SPACE) offset++;
        else break;

        pos++;
      }

      contentStart = pos;

      withStateIsolation(state, ddLine, contentStart, offset, endLine, () => {
        // If any list item is loose, mark the whole list as loose
        if (!state.tight || prevEmptyEnd) tight = false;
        // Item is loose if it ends with a blank line (excluding the terminal blank)
        prevEmptyEnd = state.line - ddLine > 1 && state.isEmpty(state.line - 1);
      });

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

    if (state.isEmpty(ddLine)) ddLine++;

    if (ddLine >= endLine || state.sCount[ddLine] < state.blkIndent) break;

    contentStart = checkAndSkipMarker(state, ddLine);

    if (contentStart < 0) break;

    // go to the next loop iteration:
    // insert DT and DD tags and repeat checking
  }

  // Finalize list
  const dlCloseToken = state.push("dl_close", "dl", -1);
  dlCloseToken.meta = { attrsRole: "container" };

  listLines[1] = nextLine;

  state.line = nextLine;

  // mark paragraphs tight if needed
  if (tight) markTightParagraphs(state, listTokenIndex);

  return true;
};

export const dl: PluginSimple = (md) => {
  md.block.ruler.before("paragraph", "dl", dlRule, {
    alt: ["paragraph", "reference", "blockquote"],
  });
};
