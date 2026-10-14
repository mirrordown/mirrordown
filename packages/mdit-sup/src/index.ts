import type MDit from "markdown-it";
import type {
  default as StateInline,
  Delimiter
} from "markdown-it/lib/rules_inline/state_inline.mjs";

const MARKER = 0x5e; /* ^ */

/**
 * markdown-it plugin for `^superscript^` syntax, rendering `<sup>` elements. A single `^` is a delimiter run like emphasis: it opens when left-flanking, closes when right-flanking, pairs with the nearest opener, and its content is parsed as inline markup, so superscript nests with subscript and emphasis.
 */
export function sup(md: MDit): void {
  md.inline.ruler.after(`emphasis`, `sup`, (state, silent) => {
    if (silent) return false;
    if (state.src.charCodeAt(state.pos) !== MARKER) return false;

    const scanned = state.scanDelims(state.pos, true);
    const token = state.push(`text`, ``, 0);
    token.content = state.src.slice(state.pos, state.pos + scanned.length);
    // A longer run is never a superscript delimiter; consuming it whole keeps its tail from being read as one.
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
        type: `sup_open`,
        tag: `sup`,
        nesting: 1,
        markup: `^`,
        content: ``
      });
      Object.assign(close, {
        type: `sup_close`,
        tag: `sup`,
        nesting: -1,
        markup: `^`,
        content: ``
      });
    }
  };

  md.inline.ruler2.after(`emphasis`, `sup`, (state) => {
    postProcess(state, state.delimiters);
    for (const meta of state.tokens_meta) {
      if (meta?.delimiters) postProcess(state, meta.delimiters);
    }
    return false;
  });
}
