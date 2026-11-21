import type { PhrasingLike } from "./github-alerts/index.js";

// Obsidian's highlight colours, shared by the three mark plugins: a highlight whose content starts with one of twelve colour emoji (`==🔴text==`) loses the emoji and is coloured, as Obsidian 1.15.0 renders it. Each plugin reads the colour once its delimiter pass has made the highlight, from the highlight's first child when that is plain text, so a marker written as a character reference, or anywhere but the very start, is text.

/** The colours a highlight can have, named as `data-highlight` gives them. */
export type HighlightColour =
  | `red`
  | `orange`
  | `yellow`
  | `green`
  | `blue`
  | `purple`;

/** The marker emoji and the colour each gives a highlight: a circle and a square per colour. A `Map`, since the key comes from the document. */
export const HIGHLIGHT_COLOURS: ReadonlyMap<string, HighlightColour> = new Map<
  string,
  HighlightColour
>([
  [`\u{1F534}`, `red`], // 🔴
  [`\u{1F7E5}`, `red`], // 🟥
  [`\u{1F7E0}`, `orange`], // 🟠
  [`\u{1F7E7}`, `orange`], // 🟧
  [`\u{1F7E1}`, `yellow`], // 🟡
  [`\u{1F7E8}`, `yellow`], // 🟨
  [`\u{1F7E2}`, `green`], // 🟢
  [`\u{1F7E9}`, `green`], // 🟩
  [`\u{1F535}`, `blue`], // 🔵
  [`\u{1F7E6}`, `blue`], // 🟦
  [`\u{1F7E3}`, `purple`], // 🟣
  [`\u{1F7EA}`, `purple`] // 🟪
]);

/**
 * Splits a colour marker off the start of `text`, the first text of a highlight's content: the colour it names and the text after it, or `undefined` when `text` does not start with one. Only the emoji's one code point goes, so a variation selector after it (`🔴️`) and a second marker (`🔴🟩`) stay in the text.
 */
export const splitHighlightColour = (
  text: string
): { colour: HighlightColour; rest: string } | undefined => {
  const first = text.codePointAt(0);
  if (first === undefined) return undefined;
  const marker = String.fromCodePoint(first);
  const colour = HIGHLIGHT_COLOURS.get(marker);
  return colour && { colour, rest: text.slice(marker.length) };
};

/**
 * Takes the colour marker off the start of a highlight's content, the `children` of an mdast highlight (remark's and Sätteri's): only a first child that is plain text can hold one. The text node and the list change in place, because the delimiter scan that built both keeps them, to restore escaped characters in and to give the highlight its attribute blocks. A text node that was only the marker is removed, so the highlight is empty. Returns the colour, or `undefined` when there is none.
 */
export const takeHighlightColour = (
  children: PhrasingLike[]
): HighlightColour | undefined => {
  const [first] = children;
  if (first?.type !== `text` || first.value === undefined) return undefined;
  const split = splitHighlightColour(first.value);
  if (!split) return undefined;
  if (split.rest) first.value = split.rest;
  else children.shift();
  return split.colour;
};
