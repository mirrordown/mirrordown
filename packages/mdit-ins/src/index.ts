import type MDit from "markdown-it";
import type {
  default as StateInline,
  Delimiter,
} from "markdown-it/lib/rules_inline/state_inline.mjs";
import type Token from "markdown-it/lib/token.mjs";

export function ins(md: MDit): void {
  md.inline.ruler.before(`emphasis`, `ins`, (state, silent) => {
    const marker = state.src.charCodeAt(state.pos);

    if (silent) {
      return false;
    }

    if (marker !== 0x2b /* + */) {
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
        // @ts-expect-error
        jump: i / 2, // 1 delimiter = 2 characters
        token: state.tokens.length - 1,
        end: -1,
        open: scanned.can_open,
        close: scanned.can_close,
      });
    }

    state.pos += scanned.length;

    return true;
  });

  const postProcess = (state: StateInline, delimiters: Delimiter[]): void => {
    let token: Token;
    const loneMarkers: number[] = [];
    const max = delimiters.length;

    for (let i = 0; i < max; i++) {
      const startDelim = delimiters[i];

      if (startDelim.marker !== 0x2b /* + */) {
        continue;
      }

      if (startDelim.end === -1) {
        continue;
      }

      const endDelim = delimiters[startDelim.end];

      token = state.tokens[startDelim.token];
      token.type = `ins_open`;
      token.tag = `ins`;
      token.nesting = 1;
      token.markup = `++`;
      token.content = ``;

      token = state.tokens[endDelim.token];
      token.type = `ins_close`;
      token.tag = `ins`;
      token.nesting = -1;
      token.markup = `++`;
      token.content = ``;

      if (
        state.tokens[endDelim.token - 1].type === `text` &&
        state.tokens[endDelim.token - 1].content === `+`
      ) {
        loneMarkers.push(endDelim.token - 1);
      }
    }

    // odd-length delimiter sequences leave a lone marker that must move after ins_close tags
    while (loneMarkers.length) {
      const i = loneMarkers.pop()!;
      let j = i + 1;

      while (j < state.tokens.length && state.tokens[j].type === `ins_close`) {
        j++;
      }

      j--;

      if (i !== j) {
        token = state.tokens[j];
        state.tokens[j] = state.tokens[i];
        state.tokens[i] = token;
      }
    }
  };

  md.inline.ruler2.before(`emphasis`, `ins`, (state) => {
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
}
