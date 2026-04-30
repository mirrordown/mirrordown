import type MDit from "markdown-it";

const UNESCAPED_SPACE_RE = /(^|[^\\])(\\\\)*\s/u;

export function sub(md: MDit): void {
  md.inline.ruler.after(`emphasis`, `sub`, (state, silent) => {
    const start = state.pos;
    const max = state.posMax;

    if (state.src.charCodeAt(start) !== 0x7e /* ~ */) return false;
    if (silent) return false;
    if (start + 2 > max) return false;

    state.pos = start + 1;
    let found = false;

    while (state.pos <= max) {
      if (state.src.charCodeAt(state.pos) === 0x7e /* ~ */) {
        found = true;
        break;
      }
      state.md.inline.skipToken(state);
    }

    if (!found || start + 1 === state.pos) {
      state.pos = start;
      return false;
    }

    const content = state.src.slice(start + 1, state.pos);

    if (UNESCAPED_SPACE_RE.test(content)) {
      state.pos = start;
      return false;
    }

    state.posMax = state.pos;
    state.pos = start + 1;

    const openToken = state.push(`sub_open`, `sub`, 1);
    openToken.markup = `~`;

    const textToken = state.push(`text`, ``, 0);
    textToken.content = content;

    const closeToken = state.push(`sub_close`, `sub`, -1);
    closeToken.markup = `~`;

    state.pos = state.posMax + 1;
    state.posMax = max;

    return true;
  });
}
