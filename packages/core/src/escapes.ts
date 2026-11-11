// Parsers resolve backslash escapes and character references before any post-parse transform runs, so a plugin that scans text nodes for delimiters sees `\==x==` and `&#61;=x==` as `==x==`. These helpers recover which characters of a text node were written that way, by aligning its value with the source it came from, and mask them while a plugin scans.

// Only ASCII punctuation can be backslash-escaped (CommonMark §2.4).
const ASCII_PUNCTUATION = /^[!-/:-@[-`{-~]$/;
const ENTITY = /&(?:#\d+|#x[\da-f]+|[a-z][\da-z]*);/iy;
// What a parser drops between two characters of one text node: the spaces around a line ending, and container prefixes such as `> `.
const DROPPED = /^[>\t\n\r ]$/;
// How far the search for a character goes after one the source does not have at that place (smart punctuation, a replaced NUL).
const RESYNC_WINDOW = 256;
const HIGH_SURROGATE = /^[\uD800-\uDBFF]$/;
const LOW_SURROGATE = /^[\uDC00-\uDFFF]$/;

// Masked characters move into Supplementary Private Use Area-A, where no delimiter pattern can match them: a UTF-16 unit maps to U+F0000 plus its value.
const MASK_BASE = 0xf0000;
const MASKED = /[\u{F0000}-\u{FFFFF}]/u;
const MASKED_ALL = /[\u{F0000}-\u{FFFFF}]/gu;

/** Whether `char` (one whole character) is a stand-in written by {@link maskEscaped}. */
export const isMasked = (char: string): boolean => MASKED.test(char);

/**
 * Indices of `value` whose character is literal in `source`, where `start`–`end` is the source range the text came from: a backslash-escaped character, or one written as a character reference (`&#45;`), which markdown-it never reads as a delimiter either. Characters the parser dropped (container prefixes such as `> `, trailing spaces) are skipped. A character the source does not have at that place (smart punctuation) is passed over, and the alignment picks up again at the next character found nearby.
 */
export const escapedIndices = (
  value: string,
  source: string,
  start: number,
  end: number
): Set<number> => {
  const escaped = new Set<number>();
  const limit = Math.min(end, source.length);
  let j = start;
  // Whether the previous character was not found, so this one may be anywhere nearby.
  let lost = false;
  for (let i = 0; i < value.length && j < limit; i++) {
    const char = value.charAt(i);
    const stop = lost ? Math.min(limit, j + RESYNC_WINDOW) : limit;
    // Where the source continues after the character, once it is found, and whether it is written there as an escape or a reference.
    let next = -1;
    let literal = false;
    for (let k = j; k < stop; k++) {
      const at = source.charAt(k);
      const after = source.charAt(k + 1);
      if (at === `\\` && k + 1 < limit && ASCII_PUNCTUATION.test(after)) {
        // A backslash escape stands for the character after the backslash.
        if (after === char) {
          next = k + 2;
          literal = true;
          break;
        }
        if (!lost) break;
        k++;
        continue;
      }
      if (at === `&`) {
        ENTITY.lastIndex = k;
        const entity = ENTITY.exec(source);
        // A reference the parser left as text (an unknown name) matches itself.
        if (
          entity &&
          k + entity[0].length <= limit &&
          !value.startsWith(entity[0], i)
        ) {
          next = k + entity[0].length;
          literal = true;
          break;
        }
      }
      if (at === char) {
        next = k + 1;
        break;
      }
      if (!lost && !DROPPED.test(at)) break;
    }
    lost = next < 0;
    if (lost) continue;
    j = next;
    if (!literal) continue;
    escaped.add(i);
    // A reference to an astral character decodes to two units.
    if (HIGH_SURROGATE.test(char) && LOW_SURROGATE.test(value.charAt(i + 1))) {
      i++;
      escaped.add(i);
    }
  }
  return escaped;
};

/**
 * Replace the characters at `escaped` with stand-ins no delimiter matches. A stand-in character the author typed is masked as well (both of its units), so {@link unmaskEscaped} gives back exactly the text that went in.
 */
export const maskEscaped = (
  value: string,
  escaped: ReadonlySet<number>
): string => {
  if (escaped.size === 0 && !MASKED.test(value)) return value;
  let out = ``;
  // Whether this unit is the second half of a stand-in the author typed.
  let half = false;
  for (let i = 0; i < value.length; i++) {
    const typed: boolean =
      half || isMasked(String.fromCodePoint(value.codePointAt(i)!));
    half = typed && !half;
    out +=
      typed || escaped.has(i)
        ? String.fromCodePoint(MASK_BASE + value.charCodeAt(i))
        : value.charAt(i);
  }
  return out;
};

/** Restore characters replaced by {@link maskEscaped}. */
export const unmaskEscaped = (value: string): string =>
  value.replace(MASKED_ALL, (c) =>
    String.fromCharCode(c.codePointAt(0)! - MASK_BASE)
  );

/** The shape of a unist text node this module reads and writes. */
export interface TextLikeNode {
  type: string;
  value?: unknown;
  position?:
    | {
        start: { offset?: number | undefined };
        end: { offset?: number | undefined };
      }
    | undefined;
  /** A text node a span scan built keeps a record of its literal characters in `data.escaped`. */
  data?: object | undefined;
  children?: readonly TextLikeNode[] | undefined;
}

// The record a rebuilt text node carries in `data.escaped`: the indices of its literal characters, and the length of the value they index. A record whose length no longer matches (a plugin edited or copied the text since) is ignored, which loses the escapes but never masks the wrong characters.
const record = (node: TextLikeNode, value: string, indices: number[]): void => {
  node.data = { ...node.data, escaped: { length: value.length, indices } };
};
const recorded = (
  data: object | undefined,
  value: string
): Set<number> | undefined => {
  const entry = data && `escaped` in data ? data.escaped : undefined;
  if (
    typeof entry !== `object` ||
    entry === null ||
    !(`length` in entry) ||
    !(`indices` in entry) ||
    entry.length !== value.length ||
    !Array.isArray(entry.indices)
  )
    return undefined;
  return new Set(
    entry.indices.filter((index): index is number => typeof index === `number`)
  );
};

/**
 * Indices of a text node's characters that are literal (see {@link escapedIndices}). A node rebuilt by a span scan has no source position, so it carries them in `data.escaped`; any other node is aligned with `source`. Pass the parent's type and whether the node is its `only` child to recognise the text of an autolink (`<https://example.com>`), which is literal throughout: markdown-it emits it as one token that no inline rule reads.
 */
export const textEscapes = (
  node: TextLikeNode,
  source: string,
  parentType?: string,
  only = false
): Set<number> => {
  const { data, value } = node;
  if (typeof value !== `string`) return new Set();
  const carried = recorded(data, value);
  if (carried) return carried;
  const start = node.position?.start.offset;
  const end = node.position?.end.offset;
  if (start === undefined || end === undefined) return new Set();
  const autolink =
    only &&
    parentType === `link` &&
    source.charAt(start - 1) === `<` &&
    source.charAt(end) === `>`;
  return autolink
    ? new Set(value.split(``).keys())
    : escapedIndices(value, source, start, end);
};

/**
 * Record on `node`, a text node holding the characters of another text node from index `from` on, which of them are among that node's `escaped` characters (see {@link textEscapes}). A plugin that splits a text node itself calls this for each piece it builds, so a span scan that runs later still tells an escaped delimiter from a real one.
 */
export const carryEscapes = (
  node: TextLikeNode,
  escaped: ReadonlySet<number>,
  from: number
): void => {
  if (typeof node.value !== `string`) return;
  const kept: number[] = [];
  for (let i = 0; i < node.value.length; i++) {
    if (escaped.has(from + i)) kept.push(i);
  }
  if (kept.length > 0) record(node, node.value, kept);
};

/**
 * Restore a text node masked with {@link maskEscaped}. A node without a source position (one a scan built from masked text) records which characters were masked in `data.escaped`, where {@link textEscapes} finds them when the next plugin scans the same text.
 */
export const restoreText = (node: TextLikeNode): void => {
  if (typeof node.value !== `string` || !MASKED.test(node.value)) return;
  const escaped: number[] = [];
  let value = ``;
  for (const char of node.value) {
    if (isMasked(char)) {
      escaped.push(value.length);
      value += unmaskEscaped(char);
    } else {
      value += char;
    }
  }
  node.value = value;
  if (!node.position) record(node, value, escaped);
};

/**
 * Mask the literal characters of every `text` node of a unist tree, so a delimiter scan skips them. Returns a function that restores them afterwards, in every text node, including those the scan created from masked text. Only text nodes are ever masked, so only they are restored. The tree's positions must refer to `source`: a tree transformed without its file (`runSync(tree)`) has no source to tell an escape by.
 */
export const maskTreeEscapes = (
  tree: TextLikeNode,
  source: string
): (() => void) => {
  const walk = (
    node: TextLikeNode,
    visit: (node: TextLikeNode, parent?: TextLikeNode) => void,
    parent?: TextLikeNode
  ): void => {
    visit(node, parent);
    node.children?.forEach((child) => walk(child, visit, node));
  };
  walk(tree, (node, parent) => {
    if (node.type !== `text` || typeof node.value !== `string`) return;
    node.value = maskEscaped(
      node.value,
      textEscapes(node, source, parent?.type, parent?.children?.length === 1)
    );
  });
  return () =>
    walk(tree, (node) => {
      if (node.type === `text`) restoreText(node);
    });
};
