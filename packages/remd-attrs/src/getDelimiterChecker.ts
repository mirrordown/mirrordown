import type { DelimiterRange } from "./types.js";
import { readAttrs } from "./getAttrs.js";

type DelimiterPosition = "start" | "end" | "only";

export type DelimiterChecker = (
  str: string,
  pos: DelimiterPosition
) => DelimiterRange | null;

/**
 * Returns a function that checks whether `str` contains a valid attribute
 * block at the given position ("start", "end", or "only") and returns the
 * [start, end] range of the content inside the delimiters, or null if no
 * match. The returned range is exclusive of the delimiter characters.
 *
 * A valid block must hold at least one attribute, as `readAttrs` reads them
 * (i.e. `{}` and `{x}` are text), and the outer delimiters must not be
 * repeated (i.e. `{{}}` is invalid). A delimiter inside a quoted value is part
 * of the value.
 */
export const getDelimiterChecker = (
  left: string,
  right: string
): DelimiterChecker => {
  const ll = left.length;
  const rl = right.length;
  const minLen = ll + 1 + rl;
  const doubleLeft = left + left;
  const doubleRight = right + right;

  return (str, pos): DelimiterRange | null => {
    if (str.length < minLen) return null;

    if (pos === "start" || pos === "only") {
      if (!str.startsWith(left)) return null;
      if (str.startsWith(doubleLeft)) return null;
    }

    if (pos === "end" || pos === "only") {
      if (!str.endsWith(right)) return null;
      if (str.endsWith(doubleRight)) return null;
    }

    if (pos === "start") {
      const block = readAttrs(str, ll, str.length, left, right);
      return block && str.startsWith(right, block.end) ? [ll, block.end] : null;
    }

    // "only" and "end": a block that closes exactly where the text does.
    const contentEnd = str.length - rl;
    const closes = (start: number): boolean =>
      readAttrs(str, start, contentEnd, left, right)?.end === contentEnd;

    // `{.a} {#b}` is text followed by a block, as "end" reads it, not one block.
    if (pos === "only") return closes(ll) ? [ll, contentEnd] : null;

    // pos === "end": the first opening delimiter a block can be read from.
    for (
      let at = str.indexOf(left);
      at !== -1 && at < contentEnd;
      at = str.indexOf(left, at + 1)
    ) {
      if (at >= ll && str.startsWith(left, at - ll)) continue;
      if (closes(at + ll)) return [at + ll, contentEnd];
    }
    return null;
  };
};
