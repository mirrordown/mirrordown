// Parsers resolve backslash escapes before any post-parse transform runs, so a
// plugin that scans text nodes for delimiters sees `\==x==` as `==x==`. These
// helpers recover which characters of a text node were escaped, by aligning its
// value with the source it came from, and mask them while a plugin scans.

// Only ASCII punctuation can be backslash-escaped (CommonMark §2.4).
const ASCII_PUNCTUATION = /^[!-/:-@[-`{-~]$/;
const ENTITY = /^&(?:#\d+|#x[\da-f]+|[a-z][\da-z]*);/i;

// Masked characters move into Supplementary Private Use Area-A, where no
// delimiter pattern can match them; every escapable character maps into
// U+F0021–U+F007E.
const MASK_BASE = 0xf0000;
const MASKED = /[\u{F0021}-\u{F007E}]/gu;

/**
 * Indices of `value` whose character was backslash-escaped in `source`, where
 * `start`–`end` is the source range the text came from. Characters the parser
 * dropped (backslashes, container prefixes such as `> `, trailing spaces) are
 * skipped, and a character reference stands for the character it decodes to.
 */
export const escapedIndices = (
  value: string,
  source: string,
  start: number,
  end: number
): Set<number> => {
  const escaped = new Set<number>();
  let j = start;
  for (let i = 0; i < value.length && j < end; i++) {
    const char = value[i];
    let entity: RegExpExecArray | null = null;
    while (j < end && source[j] !== char) {
      entity = source[j] === `&` ? ENTITY.exec(source.slice(j, end)) : null;
      if (entity) break;
      j++;
    }
    if (j >= end) break;
    if (entity) {
      j += entity[0].length;
      continue;
    }
    let slashes = 0;
    for (let k = j - 1; k >= start && source[k] === `\\`; k--) slashes++;
    if (slashes % 2 === 1 && ASCII_PUNCTUATION.test(char)) escaped.add(i);
    j++;
  }
  return escaped;
};

/** Replace the characters at `escaped` with stand-ins no delimiter matches. */
export const maskEscaped = (value: string, escaped: Set<number>): string => {
  if (escaped.size === 0) return value;
  let out = ``;
  for (let i = 0; i < value.length; i++) {
    out += escaped.has(i)
      ? String.fromCodePoint(MASK_BASE + value.charCodeAt(i))
      : value[i];
  }
  return out;
};

/** Restore characters replaced by {@link maskEscaped}. */
export const unmaskEscaped = (value: string): string =>
  value.replace(MASKED, (c) =>
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
  children?: TextLikeNode[] | undefined;
}

/**
 * Mask escaped characters in every positioned `text` node of a unist tree, so
 * a delimiter scan skips them. Returns a function that restores them in every
 * node afterwards, including nodes the scan created from masked text.
 */
export const maskTreeEscapes = (
  tree: TextLikeNode,
  source: string
): (() => void) => {
  const walk = (node: TextLikeNode, visit: (n: TextLikeNode) => void): void => {
    visit(node);
    node.children?.forEach((child) => walk(child, visit));
  };
  walk(tree, (node) => {
    const start = node.position?.start.offset;
    const end = node.position?.end.offset;
    if (node.type !== `text` || typeof node.value !== `string`) return;
    if (start === undefined || end === undefined) return;
    node.value = maskEscaped(
      node.value,
      escapedIndices(node.value, source, start, end)
    );
  });
  return () =>
    walk(tree, (node) => {
      if (typeof node.value === `string`)
        node.value = unmaskEscaped(node.value);
    });
};
