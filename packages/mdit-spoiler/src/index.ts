import type MDit from "markdown-it";
import type {
  default as StateInline,
  Delimiter
} from "markdown-it/lib/rules_inline/state_inline.mjs";

// The revealed content is a following sibling of the checkbox so CSS's
// `:checked ~ .content` combinator can reach it. Order matters: <input> must
// precede the <span>, or the reveal never fires.
const OPEN_HTML =
  `<label class="markdown-spoiler">` +
  `<input type="checkbox" class="markdown-spoiler-toggle" aria-label="spoiler">` +
  `<span class="markdown-spoiler-content">`;
const CLOSE_HTML = `</span></label>`;

// markdown-it's built-in `text` rule greedily consumes runs of non-terminator
// characters, and `|` is NOT in its default terminator set (unlike `=`, `~`,
// `^`, `+` used by the other sigil plugins). Without a break at `|`, the text
// rule swallows `||spoiler||` whole and our inline rule never runs. Re-implement
// `text` (the documented "alternative implementation" from markdown-it) with `|`
// appended to the terminator set — changing only where text runs break, not how
// any other character is handled.
const TERMINATOR_RE = /[\n!#$%&*+\-:<=>@[\\\]^_`{}~|]/;

const textWithPipeTerminator = (
  state: { src: string; pos: number; pending: string; posMax: number },
  silent: boolean
): boolean => {
  const pos = state.pos;
  const slice = state.src.slice(pos, state.posMax);
  const idx = slice.search(TERMINATOR_RE);

  // first char is a terminator -> empty text, let other rules try
  if (idx === 0) return false;

  // no terminator before posMax -> text till the end of the inline span
  if (idx < 0) {
    if (!silent) state.pending += slice;
    state.pos = state.posMax;
    return true;
  }

  if (!silent) state.pending += state.src.slice(pos, pos + idx);
  state.pos += idx;

  return true;
};

/**
 * markdown-it plugin for Discord-style spoiler syntax (`||text||`), rendering a
 * fully declarative, JavaScript-free click-to-reveal spoiler.
 *
 * Each `||...||` becomes a `<label>` wrapping a visually-hidden checkbox and a
 * `<span>` of content; CSS reveals the span when the checkbox is checked. The
 * label makes the whole black bar a click target, and the checkbox keeps it
 * keyboard-operable (Space) and announced as a control by screen readers.
 * Emits byte-identical HTML to `@mirrordown/remd-spoiler`.
 */
export function spoiler(md: MDit): void {
  // Make `|` break text runs so the spoiler delimiter rule can fire.
  md.inline.ruler.at(`text`, textWithPipeTerminator);

  md.inline.ruler.before(`emphasis`, `spoiler`, (state, silent) => {
    const marker = state.src.charCodeAt(state.pos);

    if (silent) {
      return false;
    }

    if (marker !== 0x7c /* | */) {
      return false;
    }

    const scanned = state.scanDelims(state.pos, true);
    let len = scanned.length;
    const ch = String.fromCharCode(marker);

    if (len < 2) {
      return false;
    }

    if (len % 2) {
      const token = state.push(`text`, ``, 0);
      token.content = ch;
      len--;
    }

    for (let i = 0; i < len; i += 2) {
      const token = state.push(`text`, ``, 0);
      token.content = ch + ch;

      if (!scanned.can_open && !scanned.can_close) {
        continue;
      }

      state.delimiters.push({
        marker,
        length: 0, // disable "rule of 3" length checks meant for emphasis
        // @ts-expect-error jump is not in the Delimiter type but is used by markdown-it
        jump: i / 2, // 1 delimiter = 2 characters
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
    const loneMarkers: number[] = [];

    for (const startDelim of delimiters) {
      if (startDelim.marker !== 0x7c /* | */) {
        continue;
      }

      if (startDelim.end === -1) {
        continue;
      }

      const endDelim = delimiters[startDelim.end];
      const openToken = state.tokens[startDelim.token];
      const closeToken = endDelim && state.tokens[endDelim.token];
      if (!endDelim || !openToken || !closeToken) {
        continue;
      }

      openToken.type = `spoiler_open`;
      openToken.tag = `span`;
      openToken.nesting = 1;
      openToken.markup = `||`;
      openToken.content = ``;

      closeToken.type = `spoiler_close`;
      closeToken.tag = `span`;
      closeToken.nesting = -1;
      closeToken.markup = `||`;
      closeToken.content = ``;

      const beforeClose = state.tokens[endDelim.token - 1];
      if (beforeClose?.type === `text` && beforeClose.content === `|`) {
        loneMarkers.push(endDelim.token - 1);
      }
    }

    // odd-length delimiter sequences leave a lone marker that must move after
    // spoiler_close tags
    for (let k = loneMarkers.length - 1; k >= 0; k--) {
      const i = loneMarkers[k];
      if (i === undefined) continue;
      let j = i + 1;

      while (state.tokens[j]?.type === `spoiler_close`) {
        j++;
      }

      j--;

      const from = state.tokens[i];
      const to = state.tokens[j];
      if (i !== j && from && to) {
        state.tokens[j] = from;
        state.tokens[i] = to;
      }
    }
  };

  md.inline.ruler2.before(`emphasis`, `spoiler`, (state) => {
    const tokens_meta = state.tokens_meta;
    const max = state.tokens_meta.length;

    postProcess(state, state.delimiters);

    for (let curr = 0; curr < max; curr++) {
      if (tokens_meta[curr]?.delimiters) {
        postProcess(state, tokens_meta[curr]?.delimiters ?? []);
      }
    }

    return true;
  });

  md.renderer.rules[`spoiler_open`] = (): string => OPEN_HTML;
  md.renderer.rules[`spoiler_close`] = (): string => CLOSE_HTML;
}
