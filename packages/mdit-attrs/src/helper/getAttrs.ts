import type { Attr, DelimiterRange } from "../types.js";

const CLASS_MARKER = 46; // '.'
const ID_MARKER = 35; // '#'
const PAIR_SEPARATOR = 32; // ' '
const KEY_SEPARATOR = 61; // '='
const QUOTE_MARKER = 34; // '"'

const DISALLOWED_KEY_CHARS = new Set([9, 10, 12, 32, 47, 62, 34, 39, 61]);

export const getAttrs = (
  str: string,
  range: DelimiterRange,
  allowed: (string | RegExp)[],
): Attr[] => {
  let key = "";
  let value = "";
  let parsingKey = true;
  let valueInsideQuotes = false;
  const attrs: Attr[] = [];

  for (let i = range[0]; i < range[1]; i++) {
    const code = str.charCodeAt(i);

    if (code === KEY_SEPARATOR && parsingKey) {
      parsingKey = false;
      continue;
    }

    if (code === CLASS_MARKER && key === "") {
      key = str.charCodeAt(i + 1) === CLASS_MARKER ? (i++, "css-module") : "class";
      parsingKey = false;
      continue;
    }

    if (code === ID_MARKER && key === "") {
      key = "id";
      parsingKey = false;
      continue;
    }

    if (code === QUOTE_MARKER) {
      if (value === "" && !valueInsideQuotes) {
        valueInsideQuotes = true;
      } else if (valueInsideQuotes) {
        valueInsideQuotes = false;
      }
      continue;
    }

    if (code === PAIR_SEPARATOR && !valueInsideQuotes) {
      if (key !== "") {
        attrs.push([key, value]);
        key = "";
        value = "";
        parsingKey = true;
      }
      continue;
    }

    if (parsingKey) {
      if (!DISALLOWED_KEY_CHARS.has(code)) key += str[i];
    } else {
      value += str[i];
    }
  }

  if (key !== "") attrs.push([key, value]);

  if (allowed.length === 0) return attrs;
  return attrs.filter(([attr]) =>
    allowed.some((item) => (item instanceof RegExp ? item.test(attr) : item === attr)),
  );
};
