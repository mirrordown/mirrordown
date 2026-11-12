// Forked and modified from https://github.com/lostandfound/markdown-it-ruby

import type MarkdownIt from "markdown-it";
import type Token from "markdown-it/lib/token.mjs";
import type StateInline from "markdown-it/lib/rules_inline/state_inline.mjs";

/** Options for the {@link ruby} plugin. */
export interface RubyOptions {
  /** Fallback parenthesis characters emitted as `<rp>` for browsers without ruby support. */
  rp?: [string, string];
}

// The grammar the three engines share: `{`, a base (no `|`, `{`, `}` or line ending, though it may start with `{`), `|`, a reading (no `}` or line ending), `}`. A ruby never crosses a line or another brace group, so prose braces and an attribute block before a ruby (`{.a}{b|c}`) are left alone.
const RUBY = /\{([^|}\r\n][^|{}\r\n]*)\|([^}\r\n]+)\}/y;
// Spaces and tabs around a base or a reading are not part of it, as a paragraph's are not; one that is nothing but whitespace is kept.
const tidy = (text: string): string =>
  text.replace(/^[ \t]+|[ \t]+$/g, "") || text;

function makeRule(rp: [string, string] | undefined) {
  const hasRp = Array.isArray(rp) && rp[0] !== "" && rp[1] !== "";

  return (state: StateInline, silent: boolean): boolean => {
    const start = state.pos;

    if (state.src.charCodeAt(start) !== 0x7b /* { */) return false;

    RUBY.lastIndex = start;
    const match = RUBY.exec(state.src);
    if (!match) return false;
    const end = start + match[0].length;
    if (end > state.posMax) return false;

    // A scan for the end of a link label or an emphasis run calls the rule silently: the ruby is still one unit to step over, so a `]` inside it does not end the label.
    if (silent) {
      state.pos = end;
      return true;
    }

    const baseText = tidy(match[1]);
    const rubyText = tidy(match[2]);

    const pushInline = (content: string): void => {
      const tokens: Token[] = [];
      state.md.inline.parse(content, state.md, state.env, tokens);
      for (const t of tokens) state.tokens.push(t);
    };

    const open = state.push("ruby_open", "ruby", 1);
    open.markup = "{";
    // The source of the whole run, for positions that render plain text.
    open.meta = { raw: match[0] };

    pushInline(baseText);
    if (hasRp) state.push("rp_open", "rp", 0).content = rp[0]!;
    state.push("rt_open", "rt", 1);
    pushInline(rubyText);
    state.push("rt_close", "rt", -1);
    if (hasRp) state.push("rp_close", "rp", 0).content = rp[1]!;

    state.push("ruby_close", "ruby", -1).markup = "}";

    state.pos = end;
    return true;
  };
}

const verbatimRuby = (
  children: Token[],
  state: {
    Token: new (type: string, tag: string, nesting: Token["nesting"]) => Token;
  }
): Token[] => {
  const out: Token[] = [];
  for (let i = 0; i < children.length; i++) {
    const token = children[i];
    if (token.type !== "ruby_open") {
      out.push(token);
      continue;
    }
    let depth = 1;
    while (depth > 0 && ++i < children.length) {
      if (children[i].type === "ruby_open") depth++;
      else if (children[i].type === "ruby_close") depth--;
    }
    const text = new state.Token("text", "", 0);
    const raw: unknown = token.meta?.raw;
    text.content = typeof raw === "string" ? raw : "";
    out.push(text);
  }
  return out;
};

// `rp` is a pair. With one string the other side printed as `undefined`, so anything but two strings is refused.
const checkRp = (rp: unknown): void => {
  if (rp === undefined) return;
  if (
    !Array.isArray(rp) ||
    rp.length !== 2 ||
    rp.some((side) => typeof side !== "string")
  ) {
    throw new TypeError(
      `ruby: \`rp\` must be a pair of strings, such as ["(", ")"]. Received ${JSON.stringify(rp)}.`
    );
  }
};

/** markdown-it plugin for ruby annotation syntax (`{base|reading}`), rendering `<ruby>` elements. */
export const ruby = (md: MarkdownIt, options: RubyOptions = {}): void => {
  const { rp } = options;
  checkRp(rp);
  const hasRp = Array.isArray(rp) && rp[0] !== "" && rp[1] !== "";

  if (hasRp) {
    md.renderer.rules["rp_open"] = (tokens, idx): string =>
      `<rp>${tokens[idx].content}</rp>`;
    md.renderer.rules["rp_close"] = (tokens, idx): string =>
      `<rp>${tokens[idx].content}</rp>`;
  }

  md.inline.ruler.before("text", "ruby", makeRule(rp));

  // Alt text is an attribute, which renders no markup: a ruby inside an image
  // label stays verbatim (`alt="{base|reading}"`), so the characters reach the
  // attribute exactly as written.
  md.core.ruler.after("inline", "ruby_alt_text", (state) => {
    for (const block of state.tokens) {
      for (const token of block.children ?? []) {
        if (token.type === "image" && token.children) {
          token.children = verbatimRuby(token.children, state);
        }
      }
    }
  });
};
