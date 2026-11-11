import type { Attr, DelimiterRange } from "../types.js";

const TAB = 9;
const LINE_FEED = 10;
const FORM_FEED = 12;
const CARRIAGE_RETURN = 13;
const SPACE = 32;
const DOUBLE_QUOTE = 34;
const ID_MARKER = 35; // '#'
const SINGLE_QUOTE = 39;
const CLASS_MARKER = 46; // '.'
const KEY_SEPARATOR = 61; // '='

const isSeparator = (code: number): boolean =>
  code === SPACE || code === TAB || code === FORM_FEED;

// A key as Sätteri accepts one: it opens with a letter, `_`, `:` or `@`, and goes on with those, digits, `-` and `.`.
const NAME = /^[A-Za-z_:@\u0080-￿][\w:@.\-\u0080-￿]*$/;
// The two names the shorthand writes, which HTML matches in any case: `{Class=a .b}` is one `class`.
const SHORTHAND_NAME = /^(?:class|id)$/i;

/**
 * Reads the attributes written from `start` up to `end`, or up to the first `right` delimiter outside a quoted value when that comes first, and returns them with the index it stopped at. Returns `null` when what's there isn't an attribute block, which then stays text.
 *
 * The grammar is the one Sätteri's built-in `attributes` feature reads, since that reader can't be changed and the three engines must agree. A block is words separated by spaces or tabs: `.name` adds a class and `#name` sets the id; `key=value` sets an attribute, the value running to the next separator unless it opens with `"` or `'` right after the `=`; a word of two characters or more is a key with an empty value, and a lone character is ignored. A key that isn't a name, a quote that never closes, a delimiter outside a quoted value or a line ending makes the whole block text, and so does a block that yields no attribute (`{}`, `{ }`, `{.}`, `{x}`).
 */
export const readAttrs = (
  str: string,
  start: number,
  end: number,
  left?: string,
  right?: string
): { attrs: Attr[]; end: number } | null => {
  const attrs: Attr[] = [];
  let i = start;
  while (i < end) {
    if (isSeparator(str.charCodeAt(i))) {
      i++;
      continue;
    }
    if (right && str.startsWith(right, i)) break;

    // One word: up to a separator, or through the quoted value that opens right after an `=`.
    let j = i;
    let separator = -1;
    let quote = 0;
    for (; j < end; j++) {
      const code = str.charCodeAt(j);
      if (code === LINE_FEED || code === CARRIAGE_RETURN) return null;
      if (quote) {
        if (code === quote) quote = 0;
        continue;
      }
      if (isSeparator(code)) break;
      if (right && str.startsWith(right, j)) break;
      if (left && str.startsWith(left, j)) return null;
      if (code === KEY_SEPARATOR) {
        if (separator === -1) separator = j;
        const next = str.charCodeAt(j + 1);
        if (next === DOUBLE_QUOTE || next === SINGLE_QUOTE) {
          quote = next;
          j++;
        }
      }
    }
    if (quote) return null;

    const first = str.charCodeAt(i);
    if (first === CLASS_MARKER || first === ID_MARKER) {
      if (j - i > 1) {
        attrs.push([
          first === CLASS_MARKER ? "class" : "id",
          str.slice(i + 1, j)
        ]);
      }
    } else if (j - i > 1) {
      const key = str.slice(i, separator === -1 ? j : separator);
      if (!NAME.test(key)) return null;
      let value = separator === -1 ? "" : str.slice(separator + 1, j);
      const open = value.charCodeAt(0);
      if (
        value.length > 1 &&
        (open === DOUBLE_QUOTE || open === SINGLE_QUOTE) &&
        value.charCodeAt(value.length - 1) === open
      ) {
        value = value.slice(1, -1);
      }
      attrs.push([SHORTHAND_NAME.test(key) ? key.toLowerCase() : key, value]);
    }
    i = j;
  }
  return attrs.length > 0 ? { attrs, end: i } : null;
};

export const getAttrs = (
  str: string,
  range: DelimiterRange,
  allowed: Array<string | RegExp>
): Attr[] => {
  const attrs = readAttrs(str, range[0], range[1])?.attrs ?? [];

  if (allowed.length === 0) return attrs;
  return attrs.filter(([attr]) =>
    allowed.some((item) =>
      item instanceof RegExp ? item.test(attr) : item === attr
    )
  );
};
