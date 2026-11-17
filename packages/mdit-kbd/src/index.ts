import type MarkdownIt from "markdown-it";
import type StateInline from "markdown-it/lib/rules_inline/state_inline.mjs";

const MARKER_OPEN = `[`;
const MARKER_CLOSE = `]`;
const ESCAPE_CHARACTER = `\\`;
const TAG = `kbd`;

// For each inline state: how many levels a walk standing at a position can still close before the line or the content ends, keyed by position and by the end of the content (a key's content is tokenized with a nearer end).
const closable = new WeakMap<StateInline, Map<number, number>>();

/**
 * One step of the walk from `pos`: where it goes next, and whether it took a `[[` (1), a `]]` (-1) or anything else (0). The next position is -1 at a line ending. Anything but a bracket pair is stepped over as markdown-it would tokenize it, so a code span, an autolink, an HTML tag, an escape or a link after the opener is one unit and the brackets inside it are not the key's.
 */
function step(state: StateInline, pos: number): [next: number, change: number] {
  const char = state.src.charAt(pos);
  const nextChar = state.src.charAt(pos + 1);
  if (char === MARKER_CLOSE && nextChar === MARKER_CLOSE) return [pos + 2, -1];
  if (char === MARKER_OPEN && nextChar === MARKER_OPEN) return [pos + 2, 1];
  // A backslash before a line ending is a hard break, not an escape.
  if (char === `\n` || (char === ESCAPE_CHARACTER && nextChar === `\n`)) {
    return [-1, 0];
  }
  const saved = state.pos;
  state.pos = pos;
  state.md.inline.skipToken(state);
  const next = state.pos;
  state.pos = saved;
  return [next, 0];
}

/** How many levels a walk standing at `pos` can still close. Each position is walked once, which keeps a line of unclosed openers linear. */
function levels(state: StateInline, pos: number): number {
  const max = state.posMax;
  const known = closable.get(state) ?? new Map<number, number>();
  closable.set(state, known);
  const key = (at: number): number => max * (state.src.length + 1) + at;
  const path: Array<[at: number, change: number]> = [];
  let count = 0;
  for (let at = pos; at < max;) {
    const seen = known.get(key(at));
    if (seen !== undefined) {
      count = seen;
      break;
    }
    const [next, change] = step(state, at);
    if (next < 0) break;
    path.push([at, change]);
    at = next;
  }
  for (const [at, change] of path.reverse()) {
    count = change < 0 ? count + 1 : Math.max(0, count - change);
    known.set(key(at), count);
  }
  return count;
}

/** The position of the `]]` that closes the `[[` at `start`, tracking nesting depth, or -1. The walk starts at the opener's second bracket, which pairs with a third one if there is one. */
function findClose(state: StateInline, start: number): number {
  const nested = state.src.charAt(start + 2) === MARKER_OPEN;
  let openTagCount = nested ? 2 : 1;
  let pos = nested ? start + 3 : start + 2;
  if (levels(state, pos) < openTagCount) {
    return -1;
  }
  for (;;) {
    const [next, change] = step(state, pos);
    openTagCount += change;
    if (openTagCount === 0) {
      return pos;
    }
    pos = next;
  }
}

function tokenize(state: StateInline, silent: boolean): boolean {
  if (silent) {
    return false;
  }

  const start = state.pos;
  const max = state.posMax;

  if (
    state.src.charAt(start) !== MARKER_OPEN ||
    state.src.charAt(start + 1) !== MARKER_OPEN
  ) {
    return false;
  }

  // The walk looks ahead of the tokenizer. markdown-it's code span rule notes when it has seen every backtick up to the end of the text, which only holds for backticks it is asked about in order, so the note is put back: a code span after the key is still found.
  const scanned = `backticksScanned` in state && state.backticksScanned;
  const end = findClose(state, start);
  if (`backticksScanned` in state) state.backticksScanned = scanned;

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

/** markdown-it plugin for `[[key]]` syntax, rendering `<kbd>` elements. */
export function kbd(md: MarkdownIt): void {
  md.inline.ruler.before(`link`, `kbd`, tokenize);
}
