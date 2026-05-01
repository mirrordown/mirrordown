// Forked and modified from https://github.com/lostandfound/markdown-it-ruby

import type MarkdownIt from "markdown-it";
import type Token from "markdown-it/lib/token.mjs";
import type StateInline from "markdown-it/lib/rules_inline/state_inline.mjs";

export interface RubyOptions {
  rp?: [string, string];
}

function makeRule(rp: [string, string] | undefined) {
  const hasRp = Array.isArray(rp) && rp.length === 2 && rp[0] !== "" && rp[1] !== "";

  return (state: StateInline, silent: boolean): boolean => {
    if (silent) return false;

    const max = state.posMax;
    const start = state.pos;

    if (state.src.charCodeAt(start) !== 0x7b /* { */) return false;
    if (start + 4 >= max) return false;

    let devPos = 0;
    let closePos = 0;

    for (let i = start + 1; i < max; i++) {
      const ch = state.src.charCodeAt(i);
      if (devPos) {
        if (ch === 0x7d /* } */) {
          closePos = i;
          break;
        }
      } else if (ch === 0x7c /* | */) {
        devPos = i;
      }
    }

    if (!devPos || !closePos) return false;

    const baseText = state.src.slice(start + 1, devPos);
    const rubyText = state.src.slice(devPos + 1, closePos);

    if (baseText.length === 0 || rubyText.length === 0) return false;

    const pushInline = (content: string) => {
      const tokens: Token[] = [];
      state.md.inline.parse(content, state.md, state.env, tokens);
      for (const t of tokens) state.tokens.push(t);
    };

    state.push("ruby_open", "ruby", 1).markup = "{";

    pushInline(baseText);
    if (hasRp) state.push("rp_open", "rp", 0).content = rp![0]!;
    state.push("rt_open", "rt", 1);
    pushInline(rubyText);
    state.push("rt_close", "rt", -1);
    if (hasRp) state.push("rp_close", "rp", 0).content = rp![1]!;

    state.push("ruby_close", "ruby", -1).markup = "}";

    state.pos = closePos + 1;
    return true;
  };
}

export const ruby = (md: MarkdownIt, options: RubyOptions = {}): void => {
  const { rp } = options;
  const hasRp = Array.isArray(rp) && rp.length === 2 && rp[0] !== "" && rp[1] !== "";

  if (hasRp) {
    md.renderer.rules["rp_open"] = (tokens, idx) => `<rp>${tokens[idx]!.content}</rp>`;
    md.renderer.rules["rp_close"] = (tokens, idx) => `<rp>${tokens[idx]!.content}</rp>`;
  }

  md.inline.ruler.before("text", "ruby", makeRule(rp));
};
