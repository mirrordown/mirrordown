// Obsidian's image size, read from an image's description, shared by the markdown-it, remark and Sätteri plugins: `![Engelbart|100x145](e.jpg)`, `![Engelbart|100](e.jpg)` and `![250](e.jpg)`.

/** A size read from an image's description, and the description without it. */
export interface ImageSize {
  /** What is left of the description: the image's alt text. */
  description: string;
  /** The width, as written. */
  width: string;
  /** The height, as written, when the size gives one. */
  height: string | undefined;
}

// A width, and optionally a lower-case `x` and a height: each one to five ASCII digits, not starting with `0`. Anchored at both ends, so nothing else may follow: `100px`, `100 `, `100x`.
const SIZE = /^([1-9][0-9]{0,4})(?:x([1-9][0-9]{0,4}))?$/;

const WHITESPACE = ` \t\n\f\r`;

// The text without the whitespace at its end. A scan, not `/[ \t\n\f\r]+$/`: that pattern tries again from every character of a long run of spaces that is not at the end.
const trimEnd = (text: string): string => {
  let end = text.length;
  while (end > 0 && WHITESPACE.includes(text.charAt(end - 1))) end--;
  return text.slice(0, end);
};

/**
 * The size an image's description ends with, as Obsidian reads it: `|W` or `|WxH` at the end, or a description that is only `W` or `WxH`. Only the last `|` is read, so `a|b|100` leaves `a|b`. The description left over loses the whitespace at its end. `undefined` when the description holds no size, and then it is left as it is.
 */
export const parseImageSize = (description: string): ImageSize | undefined => {
  const bar = description.lastIndexOf(`|`);
  const match = SIZE.exec(description.slice(bar + 1));
  if (!match) return undefined;
  const [, width = ``, height] = match;
  return {
    description: bar < 0 ? `` : trimEnd(description.slice(0, bar)),
    width,
    height
  };
};
