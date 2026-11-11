import type MDit from "markdown-it";
import type {
  default as StateInline,
  Delimiter,
  Scanned
} from "markdown-it/lib/rules_inline/state_inline.mjs";

// balance_pairs pairs delimiters by `marker` alone, and strikethrough pushes `~` delimiters too: a value of our own keeps a `~sub~` delimiter from pairing with a `~~strike~~` one.
const MARKER = 0x7e + 0x10000;

// Ruler has no public way to ask whether a rule is enabled, and rules can be switched after the plugin is added, so this reads its list at parse time. The list is a private field: should a markdown-it release drop it, strikethrough counts as on, its default, so documents keep rendering.
const strikethroughEnabled = (md: MDit): boolean => {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const ruler = md.inline.ruler as unknown as {
    __rules__?: Array<{ name: string; enabled: boolean }>;
  };
  return (
    ruler.__rules__?.some(
      (rule) => rule.name === `strikethrough` && rule.enabled
    ) ?? true
  );
};

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

  // GFM counts `~` as an attention marker: a `*` run flanks a tilde beside it as if the tilde were not punctuation, so `x*~i~*` is emphasis in remark-gfm and in Sätteri (which can't be changed). markdown-it's `scanDelims` has no such rule, so this adds it: only for `*` (a `_` run can't open or close inside a word either way), and only while strikethrough is on, which is what GFM is in markdown-it. Without GFM the other two leave those asterisks literal as well.
  md.inline.State = class extends md.inline.State {
    override scanDelims(start: number, canSplitWord: boolean): Scanned {
      const scanned = super.scanDelims(start, canSplitWord);
      if (this.src.charCodeAt(start) !== 0x2a /* * */) return scanned;
      const end = start + scanned.length;
      const opens =
        end < this.posMax && this.src.charCodeAt(end) === 0x7e; /* ~ */
      const closes = start > 0 && this.src.charCodeAt(start - 1) === 0x7e;
      if ((opens || closes) && strikethroughEnabled(this.md)) {
        scanned.can_open ||= opens;
        scanned.can_close ||= closes;
      }
      return scanned;
    }
  };

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
