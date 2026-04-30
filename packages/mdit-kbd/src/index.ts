import type MarkdownIt from "markdown-it";
import type StateInline from "markdown-it/lib/rules_inline/state_inline.mjs";

const MARKER_OPEN = `[`;
const MARKER_CLOSE = `]`;
const ESCAPE_CHARACTER = `\\`;
const TAG = `kbd`;

function tokenize(state: StateInline, silent: boolean): boolean {
  if (silent) {
    return false;
  }

  const start = state.pos;
  const max = state.posMax;
  let momChar = state.src.charAt(start);
  let nextChar = state.src.charAt(start + 1);

  if (momChar !== MARKER_OPEN || nextChar !== MARKER_OPEN) {
    return false;
  }

  // Find the closing ]] tracking nesting depth
  let openTagCount = 1;
  let end = -1;
  let skipNext = false;
  for (let i = start + 1; i < max && end === -1; i++) {
    momChar = nextChar;
    nextChar = state.src.charAt(i + 1);
    if (skipNext) {
      skipNext = false;
      continue;
    }
    if (momChar === MARKER_CLOSE && nextChar === MARKER_CLOSE) {
      openTagCount -= 1;
      if (openTagCount === 0) {
        end = i;
      }
      skipNext = true;
    } else if (momChar === MARKER_OPEN && nextChar === MARKER_OPEN) {
      openTagCount += 1;
      skipNext = true;
    } else if (momChar === `\n`) {
      // Newline before closing sequence — ignore start
      return false;
    } else if (momChar === ESCAPE_CHARACTER) {
      skipNext = true;
    }
  }

  if (end === -1) {
    return false;
  }

  state.push(`kbd_open`, TAG, 1);
  state.pos += 2;
  state.posMax = end;
  state.md.inline.tokenize(state);
  state.pos = end + 2;
  state.posMax = max;
  state.push(`kbd_close`, TAG, -1);

  return true;
}

export function kbd(md: MarkdownIt): void {
  md.inline.ruler.before(`link`, `kbd`, tokenize);
}
