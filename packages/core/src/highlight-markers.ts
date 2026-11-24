import type { PhrasingLike } from "./github-alerts/index.js";

// Highlight markers, shared by the three mark plugins: a highlight whose content starts with a marker emoji (`==🔴text==`, `==🐛 Bug==`) names a variant in `data-highlight`. Obsidian's six colours lose their emoji, as Obsidian 1.15.0 renders them; the labels keep theirs, so a variant can be told apart without its colour. Each plugin reads the marker once its delimiter pass has made the highlight, from the highlight's first child when that is plain text, so a marker written as a character reference, or anywhere but the very start, is text.

/** A variant a marker gives a highlight: its name in `data-highlight`, and whether the marker's emoji stays in the content. */
export interface HighlightVariant {
  name: string;
  keep: boolean;
}

/** One entry of the `markers` option: a variant name (the emoji is kept), a name and whether the emoji is kept (`keep`, `true` unless set), or `false` to turn a default marker off. */
export type HighlightMarker = string | { name: string; keep?: boolean } | false;

/** Options of the three mark plugins. */
export interface MarkOptions {
  /** Marker emoji and the variant each names, merged over {@link HIGHLIGHT_MARKERS}. A key is compared without the variation selector U+FE0F, so `⚠` and `⚠️` are one key. */
  markers?: Record<string, HighlightMarker>;
}

/** The default markers: a circle and a square for each of Obsidian's six colours, whose emoji is removed, then GitHub's nine default issue labels and a warning, whose emoji is kept. */
export const HIGHLIGHT_MARKERS: ReadonlyMap<
  string,
  Readonly<HighlightVariant>
> = new Map<string, Readonly<HighlightVariant>>([
  [`\u{1F534}`, { name: `red`, keep: false }], // 🔴
  [`\u{1F7E5}`, { name: `red`, keep: false }], // 🟥
  [`\u{1F7E0}`, { name: `orange`, keep: false }], // 🟠
  [`\u{1F7E7}`, { name: `orange`, keep: false }], // 🟧
  [`\u{1F7E1}`, { name: `yellow`, keep: false }], // 🟡
  [`\u{1F7E8}`, { name: `yellow`, keep: false }], // 🟨
  [`\u{1F7E2}`, { name: `green`, keep: false }], // 🟢
  [`\u{1F7E9}`, { name: `green`, keep: false }], // 🟩
  [`\u{1F535}`, { name: `blue`, keep: false }], // 🔵
  [`\u{1F7E6}`, { name: `blue`, keep: false }], // 🟦
  [`\u{1F7E3}`, { name: `purple`, keep: false }], // 🟣
  [`\u{1F7EA}`, { name: `purple`, keep: false }], // 🟪
  [`\u{1F41B}`, { name: `bug`, keep: true }], // 🐛
  [`\u{1F4D6}`, { name: `documentation`, keep: true }], // 📖
  [`\u{2728}`, { name: `enhancement`, keep: true }], // ✨
  [`\u{2753}`, { name: `question`, keep: true }], // ❓
  [`\u{1F64B}`, { name: `help-wanted`, keep: true }], // 🙋
  [`\u{1F331}`, { name: `good-first-issue`, keep: true }], // 🌱
  [`\u{1F46F}`, { name: `duplicate`, keep: true }], // 👯
  [`\u{1F6AB}`, { name: `invalid`, keep: true }], // 🚫
  [`\u{26D4}`, { name: `wontfix`, keep: true }], // ⛔
  [`\u{26A0}\u{FE0F}`, { name: `warning`, keep: true }] // ⚠️
]);

/** Reads a highlight's marker under one plugin instance's options. */
export interface HighlightMarkers {
  /**
   * Splits a marker off the start of `text`, the first text of a highlight's content: the variant it names and the content that remains, or `undefined` when `text` does not start with one. Of several markers that match, the longest wins. A kept marker leaves `text` as it is; a removed one takes its code points, and one variation selector after them when its key was written with one, so `🔴️` keeps its selector.
   */
  split: (text: string) => { variant: string; rest: string } | undefined;
  /**
   * Takes the marker off the start of a highlight's content, the `children` of an mdast highlight (remark's and Sätteri's): only a first child that is plain text can hold one. The text node and the list change in place, because the delimiter scan that built both keeps them, to restore escaped characters in and to give the highlight its attribute blocks. A text node that was only a removed marker is dropped, so the highlight is empty. Returns the variant, or `undefined` when there is none.
   */
  take: (children: PhrasingLike[]) => string | undefined;
}

const SELECTOR = 0xfe0f;
const VARIANT_NAME = /^[\p{L}\p{N}_-]+$/u;

interface Marker extends HighlightVariant {
  // Whether the key ends with U+FE0F, so a removed marker also takes the one after it in the text.
  selector: boolean;
}

// One node per code point of a key, so a text is read once from its start however many markers there are, and the longest key that matches is the last marker passed.
interface TrieNode {
  next: Map<number, TrieNode>;
  marker?: Marker;
}

const withoutSelectors = (key: string): string =>
  key.replaceAll(`\u{FE0F}`, ``);

/**
 * Builds the marker reader for one plugin instance: the defaults with `options.markers` merged over them. Throws a `TypeError` for a key that is empty or holds whitespace, and for a variant name that is not letters, digits, `_` and `-`. The options are read, never written.
 */
export const createHighlightMarkers = (
  options: MarkOptions = {}
): HighlightMarkers => {
  // Keyed as the text is compared, without variation selectors. A `Map`: a key is the author's text, and a plain object would also find `constructor`.
  const table = new Map<string, Marker>();
  const add = (key: string, { name, keep }: HighlightVariant): void => {
    table.set(withoutSelectors(key), {
      name,
      keep,
      selector: key.endsWith(`\u{FE0F}`)
    });
  };
  for (const [key, variant] of HIGHLIGHT_MARKERS) add(key, variant);

  // What a caller without the types may have passed.
  const given: Record<string, unknown> = options.markers ?? {};
  for (const [key, setting] of Object.entries(given)) {
    // A key of only variation selectors would match every highlight.
    if (!withoutSelectors(key) || /\s/u.test(key))
      throw new TypeError(
        `mark: the marker ${JSON.stringify(key)} must be one or more characters, not only U+FE0F, with no whitespace`
      );
    if (setting === false) {
      table.delete(withoutSelectors(key));
      continue;
    }
    const name =
      typeof setting === `string`
        ? setting
        : typeof setting === `object` && setting !== null && `name` in setting
          ? setting.name
          : undefined;
    if (typeof name !== `string` || !VARIANT_NAME.test(name))
      throw new TypeError(
        `mark: the marker ${JSON.stringify(key)} must name a variant of letters, digits, "_" and "-", as a string or as { name, keep }, or be false`
      );
    const keep =
      typeof setting === `object` && setting !== null && `keep` in setting
        ? setting.keep !== false
        : true;
    add(key, { name, keep });
  }

  const root: TrieNode = { next: new Map() };
  for (const [bare, marker] of table) {
    let node = root;
    for (const char of bare) {
      const point = char.codePointAt(0) ?? 0;
      let next = node.next.get(point);
      if (!next) {
        next = { next: new Map() };
        node.next.set(point, next);
      }
      node = next;
    }
    node.marker = marker;
  }

  const split: HighlightMarkers[`split`] = (text) => {
    let node = root;
    let found: Marker | undefined;
    let end = 0;
    for (let i = 0; i < text.length;) {
      const point = text.codePointAt(i) ?? 0;
      i += point > 0xffff ? 2 : 1;
      // A variation selector inside a marker or after it is passed over, as the keys were stored without one. One at the very start is not part of a marker.
      if (point === SELECTOR && node !== root) continue;
      const next = node.next.get(point);
      if (!next) break;
      node = next;
      if (node.marker) {
        found = node.marker;
        end = i;
      }
    }
    if (!found) return undefined;
    if (found.keep) return { variant: found.name, rest: text };
    if (found.selector && text.charCodeAt(end) === SELECTOR) end += 1;
    return { variant: found.name, rest: text.slice(end) };
  };

  const take: HighlightMarkers[`take`] = (children) => {
    const [first] = children;
    if (first?.type !== `text` || first.value === undefined) return undefined;
    const marker = split(first.value);
    if (!marker) return undefined;
    if (marker.rest) first.value = marker.rest;
    else children.shift();
    return marker.variant;
  };

  return { split, take };
};
