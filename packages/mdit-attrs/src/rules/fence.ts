import type { DelimiterConfig } from "../types.js";
import { addAttrs, getDelimiterChecker } from "../helper/index.js";
import { readAttrs } from "../helper/getAttrs.js";
import type { AttrRule } from "./types.js";

// One backslash escape or character reference, as markdown-it's `unescapeAll` matches them.
const ESCAPE = /\\[!-/:-@[-`{-~]|&[a-z#][a-z0-9]{1,31};/gi;
// Stands in for a delimiter character that was escaped or written as a reference, which no block opens or closes with.
const LITERAL = String.fromCharCode(0xffff);

/**
 * An info string as markdown-it's fence renderer, remark and Sätteri read it, with its backslash escapes and character references resolved: `text` is that, `masked` the same with every escaped or referenced delimiter character replaced by a stand-in of the same length, and `rawAt` the index in `raw` each of its characters was written at.
 */
const decodeInfo = (
  raw: string,
  delimiters: string,
  unescapeAll: (str: string) => string
): { text: string; masked: string; rawAt: number[] } => {
  let text = "";
  let masked = "";
  const rawAt: number[] = [];
  let last = 0;
  const copy = (to: number): void => {
    for (let i = last; i < to; i++) rawAt.push(i);
    text += raw.slice(last, to);
    masked += raw.slice(last, to);
  };
  for (const match of raw.matchAll(ESCAPE)) {
    copy(match.index);
    const resolved = unescapeAll(match[0]);
    for (const char of resolved.split("")) {
      rawAt.push(match.index);
      masked += delimiters.includes(char) ? LITERAL : char;
    }
    text += resolved;
    last = match.index + match[0].length;
  }
  copy(raw.length);
  return { text, masked, rawAt };
};

export const createFenceRule = (
  options: DelimiterConfig,
  unescapeAll: (str: string) => string
): AttrRule => {
  const { left, right } = options;
  const check = getDelimiterChecker(left, right);

  return {
    name: "fence attributes",
    tests: [
      {
        shift: 0,
        type: "fence"
      }
    ],
    transform(tokens, index) {
      const token = tokens[index];
      // `token.info` is the info string as written. markdown-it's fence renderer resolves its escapes and references before reading the language, and remark and Sätteri hand over the resolved string, so the block is read from that: `{title="a&amp;b"}` sets `a&b`. A delimiter that was escaped or referenced isn't one, as in a paragraph, though inside a quoted value it is an ordinary brace.
      const raw = token.info.trim();
      const info = decodeInfo(raw, left + right, unescapeAll);
      const range = check(info.masked, "end") ?? check(info.masked, "only");
      if (!range) return;
      const block = readAttrs(info.text, range[0], range[1], left, right);
      if (block?.end !== range[1]) return;
      addAttrs(token, info.text, range, options.allowed);
      // Strip the attr block from the info string, preserving the language tag
      const open = info.masked.lastIndexOf(left, range[0] - 1);
      token.info = raw.slice(0, info.rawAt[open]).trimEnd();
      // markdown-it's fence renderer appends the language class to an existing
      // `class` attribute but otherwise adds `class` last. Reserve the slot
      // first, so `class` leads as it does in remd (mdast-util-to-hast creates
      // the language class before applying attributes, and a remark plugin
      // cannot reorder it). The renderer wrapper trims the leading space.
      if (token.info && token.attrIndex("class") < 0) {
        token.attrs = [["class", ""], ...(token.attrs ?? [])];
        token.meta = { ...token.meta, attrsReservedClass: true };
      }
    }
  };
};
