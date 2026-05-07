import type { DelimiterRange } from "../types.js";

type DelimiterPosition = "start" | "end" | "only";

export type DelimiterChecker = (str: string, pos: DelimiterPosition) => DelimiterRange | null;

/**
 * Returns a function that checks whether `str` contains a valid attribute
 * block at the given position ("start", "end", or "only") and returns the
 * [start, end] range of the content inside the delimiters, or null if no
 * match. The returned range is exclusive of the delimiter characters.
 *
 * A valid block must contain at least one character (i.e. `{}` is invalid),
 * and the outer delimiters must not be repeated (i.e. `{{}}` is invalid).
 */
export const getDelimiterChecker = (left: string, right: string): DelimiterChecker => {
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

    if (pos === "only") {
      const contentEnd = str.length - rl;
      if (contentEnd <= ll) return null;
      return [ll, contentEnd];
    }

    if (pos === "start") {
      const end = str.indexOf(right, ll + 1);
      if (end === -1) return null;
      return [ll, end];
    }

    // pos === "end"
    const start = str.lastIndexOf(left, str.length - rl - 1);
    if (start === -1) return null;
    if (str.startsWith(left, start - ll)) return null;
    return [start + ll, str.length - rl];
  };
};
