import type { Attr, DelimiterRange } from "../types.js";

const CLASS_MARKER = 46; // '.'
const ID_MARKER = 35; // '#'
const PAIR_SEPARATOR = 32; // ' '
const KEY_SEPARATOR = 61; // '='
const QUOTE_MARKER = 34; // '"'

const isAllowedKeyChar = (code: number): boolean =>
  code !== 9 && // \t
  code !== 10 && // \n
  code !== 12 && // \f
  code !== 32 && // space
  code !== 47 && // /
  code !== 62 && // >
  code !== 34 && // "
  code !== 39 && // '
  code !== 61; // =

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
      if (str.charCodeAt(i + 1) === CLASS_MARKER) {
        key = "css-module";
        i++;
      } else {
        key = "class";
      }
      parsingKey = false;
      continue;
    }

    if (code === ID_MARKER && key === "") {
      key = "id";
      parsingKey = false;
      continue;
    }

    if (code === QUOTE_MARKER && value === "" && !valueInsideQuotes) {
      valueInsideQuotes = true;
      continue;
    }

    if (code === QUOTE_MARKER && valueInsideQuotes) {
      valueInsideQuotes = false;
      continue;
    }

    if (code === PAIR_SEPARATOR && !valueInsideQuotes) {
      if (key === "") continue;
      attrs.push([key, value]);
      key = "";
      value = "";
      parsingKey = true;
      continue;
    }

    if (parsingKey && !isAllowedKeyChar(code)) continue;

    if (parsingKey) {
      key += String.fromCharCode(code);
    } else {
      value += String.fromCharCode(code);
    }
  }

  if (key !== "") attrs.push([key, value]);

  return allowed.length > 0
    ? attrs.filter(([attr]) =>
        allowed.some((item) => (item instanceof RegExp ? item.test(attr) : item === attr)),
      )
    : attrs;
};
