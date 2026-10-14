import type MDit from "markdown-it";
import type {
  default as StateInline,
  Delimiter
} from "markdown-it/lib/rules_inline/state_inline.mjs";

// balance_pairs pairs delimiters by `marker` alone, and strikethrough pushes `~` delimiters too: a value of our own keeps a `~sub~` delimiter from pairing with a `~~strike~~` one.
const MARKER = 0x7e + 0x10000;

/**
 * markdown-it plugin for `~subscript~` syntax, rendering `<sub>` elements. A single `~` is a delimiter run like emphasis: it opens when left-flanking, closes when right-flanking, pairs with the nearest opener, and its content is parsed as inline markup, so subscript nests with superscript and emphasis.
 */
export function sub(md: MDit): void {
  // After strikethrough, which takes `~~` runs when it is enabled.
  md.inline.ruler.after(`strikethrough`, `sub`, (state, silent) => {
    if (silent) return false;
    if (state.src.charCodeAt(state.pos) !== 0x7e /* ~ */) return false;

    const scanned = state.scanDelims(state.pos, true);
    const token = state.push(`text`, ``, 0);
    token.content = state.src.slice(state.pos, state.pos + scanned.length);
    // A longer run is never a subscript delimiter; consuming it whole keeps its tail from being read as one.
    if (scanned.length === 1 && (scanned.can_open || scanned.can_close)) {
      state.delimiters.push({
        marker: MARKER,
        length: 0, // disable "rule of 3" length checks meant for emphasis
        token: state.tokens.length - 1,
        end: -1,
        open: scanned.can_open,
        close: scanned.can_close
      });
    }
    state.pos += scanned.length;
    return true;
  });

  const postProcess = (state: StateInline, delimiters: Delimiter[]): void => {
    for (const start of delimiters) {
      if (start.marker !== MARKER || start.end === -1) continue;
      const end = delimiters[start.end];
      const open = state.tokens[start.token];
      const close = state.tokens[end.token];
      Object.assign(open, {
        type: `sub_open`,
        tag: `sub`,
        nesting: 1,
        markup: `~`,
        content: ``
      });
      Object.assign(close, {
        type: `sub_close`,
        tag: `sub`,
        nesting: -1,
        markup: `~`,
        content: ``
      });
    }
  };

  md.inline.ruler2.after(`strikethrough`, `sub`, (state) => {
    postProcess(state, state.delimiters);
    for (const meta of state.tokens_meta) {
      if (meta?.delimiters) postProcess(state, meta.delimiters);
    }
    return false;
  });
}
