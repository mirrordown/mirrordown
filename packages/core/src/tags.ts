// What a tag is and where one may start, shared by the markdown-it, remark and Sätteri plugins. A tag is `#` and a run of tag characters, at least one of them not an ASCII digit. A `#` opens one only at the start of its parent's content, after whitespace, or where another tag ends, so `abc#def`, `(#tag)` and a URL's fragment stay text. Each engine hands the scan a run of text and which of its characters were escaped.

import { carryEscapes, type TextLikeNode } from "./escapes.js";

/** Options for the tags plugins. */
export interface TagsOptions {
  /** The link target of a tag, given its name without the `#`. Default: `#` and the name as written, with nothing encoded. */
  href?: (name: string) => string;
}

/** A piece of a run of text: plain text, or a tag by its name (without the `#`). */
export type TagPart = { text: string } | { tag: string };

// What ends a tag, as Obsidian 1.15.0 reads it, measured character by character by `quartz-community/remark-obsidian`: whitespace, ASCII punctuation other than `_`, `-` and `/`, and the Unicode blocks General Punctuation (U+2000 to U+206F) and Supplemental Punctuation (U+2E00 to U+2E7F). Every other character continues a tag: CJK punctuation (`，`, `「`), `§` and emoji do, and the zero-width joiner, in General Punctuation, ends one. None of these is outside the Basic Multilingual Plane.
const TAG_END =
  /^[\s!"#$%&'()*+,.:;<=>?@[\\\]^`{|}~\u2000-\u206f\u2e00-\u2e7f]$/u;
// A digit is ASCII `0` to `9` only, so `#１２３` (full-width) and `#١٢٣` (Arabic-Indic) are tags.
const DIGIT = /^[0-9]$/;
// markdown-it's isWhiteSpace, which the delimiter scans use too: the Unicode spaces, a tab and the line endings.
const WHITESPACE =
  /^[\t\n\v\f\r \u00a0\u1680\u2000-\u200a\u202f\u205f\u3000]$/u;

/** The link target `options` give a tag, by its name. */
export const tagHref =
  (options: TagsOptions = {}): ((name: string) => string) =>
  (name) =>
    options.href === undefined ? `#${name}` : options.href(name);

/**
 * The pieces of `value`, a run of text, with each tag in it, or `undefined` when it holds none. `escaped` holds the indices of the characters written as a backslash escape or a character reference: a `#` written that way opens nothing, a character written that way ends a tag before it, and whitespace written that way does not let a tag start after it. `opens` says whether a tag may start at the first character, because the text starts its parent's content or follows a line break; anywhere else, a `#` opens a tag only after whitespace or where another tag ends.
 */
export const scanTags = (
  value: string,
  escaped: ReadonlySet<number>,
  opens: boolean
): TagPart[] | undefined => {
  const parts: TagPart[] = [];
  // Where the text not yet taken into a part starts, which is also where the last tag ended.
  let last = 0;
  for (let at = value.indexOf(`#`); at >= 0; at = value.indexOf(`#`, at + 1)) {
    if (escaped.has(at)) continue;
    // Whitespace written as a character reference (`&nbsp;#tag`) is literal text to Obsidian, and no tag follows it.
    const starts =
      at === 0
        ? opens
        : at === last ||
          (WHITESPACE.test(value.charAt(at - 1)) && !escaped.has(at - 1));
    if (!starts) continue;
    // The run of tag characters is taken whole: a tag of digits alone is text, not a shorter tag.
    let end = at + 1;
    let named = false;
    while (end < value.length && !escaped.has(end)) {
      const char = String.fromCodePoint(value.codePointAt(end) ?? 0);
      if (TAG_END.test(char)) break;
      named ||= !DIGIT.test(char);
      end += char.length;
    }
    if (!named) continue;
    if (at > last) parts.push({ text: value.slice(last, at) });
    parts.push({ tag: value.slice(at + 1, end) });
    last = end;
    // The search for the next `#` starts where this tag ends.
    at = end - 1;
  }
  if (parts.length === 0) return undefined;
  if (last < value.length) parts.push({ text: value.slice(last) });
  return parts;
};

/** The nodes {@link tagChildren} builds: a text node, and a tag's node from its name and link target. */
export interface TagNodes<N> {
  text: (value: string) => N;
  tag: (name: string, href: string) => N;
}

/**
 * The children of an mdast parent with the tags in their text made nodes, or `undefined` when they hold none. Adjacent text nodes are read as one run, as markdown-it reads its text tokens. A run's first character can open a tag when the run is the parent's first child or follows a hard line break (`break`); after any other node (code, a link, an image, raw HTML, emphasis) it can't. `escapes` gives the indices of a text node's escaped characters (see `textEscapes`). The pieces of a split run keep a record of theirs (see `carryEscapes`), so a plugin that scans after this one still tells an escaped delimiter from a real one.
 */
export const tagChildren = <N extends TextLikeNode>(
  children: readonly N[],
  escapes: (node: N) => ReadonlySet<number>,
  nodes: TagNodes<N>,
  href: (name: string) => string
): N[] | undefined => {
  const out: N[] = [];
  let changed = false;
  let index = 0;
  while (index < children.length) {
    let end = index;
    let value = ``;
    for (
      let child = children[end];
      child?.type === `text` && typeof child.value === `string`;
      child = children[end]
    ) {
      value += child.value;
      end++;
    }
    if (end === index) {
      const node = children[index];
      if (node) out.push(node);
      index++;
      continue;
    }
    const run = children.slice(index, end);
    const before = children[index - 1];
    // Finding which characters were escaped means aligning the text with its source, so it is done only for text that could hold a tag.
    const escaped = value.includes(`#`) ? runEscapes(run, escapes) : undefined;
    const parts =
      escaped &&
      scanTags(value, escaped, before === undefined || before.type === `break`);
    index = end;
    if (!escaped || !parts) {
      out.push(...run);
      continue;
    }
    changed = true;
    let offset = 0;
    for (const part of parts) {
      if (`tag` in part) {
        out.push(nodes.tag(part.tag, href(part.tag)));
        offset += part.tag.length + 1;
        continue;
      }
      const text = nodes.text(part.text);
      carryEscapes(text, escaped, offset);
      offset += part.text.length;
      out.push(text);
    }
  }
  return changed ? out : undefined;
};

// The escaped characters of a run of text nodes, as indices into their joined values.
const runEscapes = <N extends TextLikeNode>(
  run: readonly N[],
  escapes: (node: N) => ReadonlySet<number>
): Set<number> => {
  const escaped = new Set<number>();
  let offset = 0;
  for (const node of run) {
    for (const index of escapes(node)) escaped.add(offset + index);
    offset += typeof node.value === `string` ? node.value.length : 0;
  }
  return escaped;
};

/** What makes two tags the same tag: Obsidian compares them ignoring case. */
export const tagKey = (name: string): string => name.toLowerCase();

/** A nested tag and the tags it is nested under, outermost first: `inbox/to-read` gives `["inbox", "inbox/to-read"]`. Obsidian counts a note tagged `#inbox/to-read` under `inbox` too. Empty segments are skipped (`a//b` gives `["a", "a//b"]`), and a name is never listed twice. */
export const tagAncestors = (name: string): string[] => {
  const names: string[] = [];
  // Each `/` that ends a segment that is not empty ends the name of a tag above this one.
  let start = 0;
  for (let slash = name.indexOf(`/`); slash >= 0;) {
    if (slash > start) names.push(name.slice(0, slash));
    start = slash + 1;
    slash = name.indexOf(`/`, start);
  }
  names.push(name);
  return names;
};

// Names kept in the order of the positions they were inserted at, in `names` from index `base` on.
interface OrderedNames {
  insert: (name: string, at: number) => void;
  remove: (key: string, at: number) => void;
}

const orderedNames = (names: string[], base: number): OrderedNames => {
  const positions: number[] = [];
  // The index of the first position after `at`, or with `inclusive`, the first at or after it.
  const search = (at: number, inclusive: boolean): number => {
    let low = 0;
    let high = positions.length;
    while (low < high) {
      const middle = (low + high) >>> 1;
      const position = positions[middle] ?? at;
      if (position < at || (!inclusive && position === at)) low = middle + 1;
      else high = middle;
    }
    return low;
  };
  return {
    // A name given the same position as one already there goes after it.
    insert: (name, at) => {
      const index = search(at, false);
      positions.splice(index, 0, at);
      names.splice(base + index, 0, name);
    },
    remove: (key, at) => {
      let index = search(at, true);
      while (
        index < positions.length &&
        tagKey(names[base + index] ?? ``) !== key
      )
        index++;
      positions.splice(index, 1);
      names.splice(base + index, 1);
    }
  };
};

// The tags a frontmatter's `tags` property lists, read as Obsidian reads it: a list of strings or a single string, each without a leading `#`. A frontmatter without the property, or with it empty (`tags:` in YAML, which is `null`), lists none. `undefined` when it holds anything else.
const listedTags = (value: unknown): string[] | undefined => {
  const withoutHash = (name: string): string =>
    name.startsWith(`#`) ? name.slice(1) : name;
  if (value === undefined || value === null) return [];
  if (typeof value === `string`) return [withoutHash(value)];
  if (!Array.isArray(value)) return undefined;
  const names: unknown[] = value;
  return names.every((name): name is string => typeof name === `string`)
    ? names.map(withoutHash)
    : undefined;
};

/**
 * Collects a document's tags in document order. `add` takes the tag's name and a number that grows with the tag's place in the document (its source offset); calls may come in any order. `tags` is the same array throughout, kept in order, one entry per tag by {@link tagKey}, with the casing of the earliest occurrence.
 *
 * Given a `frontmatter` object (Astro's, which it returns with the render), the collector also keeps its `tags` up to date as the note's tags the way Obsidian counts them: the tags the frontmatter already lists, then the document's tags that are not among them by {@link tagKey}. A frontmatter whose `tags` holds anything but a string or a list of strings is left as it is.
 */
export const createTagCollector = (
  frontmatter?: unknown
): { tags: string[]; add: (name: string, at: number) => void } => {
  const tags: string[] = [];
  const ordered = orderedNames(tags, 0);
  // The position each tag's entry has, by its key. A Map, since the keys are the document's text (`constructor`, `__proto__`).
  const entries = new Map<string, number>();
  // The inline part of the frontmatter's list, and the keys of the tags the frontmatter lists itself.
  let note: OrderedNames | undefined;
  let listedKeys: ReadonlySet<string> = new Set();
  if (typeof frontmatter === `object` && frontmatter !== null) {
    const listed = listedTags(
      `tags` in frontmatter ? frontmatter.tags : undefined
    );
    if (listed) {
      listedKeys = new Set(listed.map(tagKey));
      note = orderedNames(listed, listed.length);
      Object.assign(frontmatter, { tags: listed });
    }
  }
  return {
    tags,
    add: (name, at) => {
      const key = tagKey(name);
      const known = entries.get(key);
      if (known !== undefined && known <= at) return;
      // A tag seen again earlier in the document moves to that place and takes the casing written there.
      entries.set(key, at);
      const inline = listedKeys.has(key) ? undefined : note;
      if (known !== undefined) {
        ordered.remove(key, known);
        inline?.remove(key, known);
      }
      ordered.insert(name, at);
      inline?.insert(name, at);
    }
  };
};
