// Soft line breaks inside Chinese and Japanese text. Authors wrap paragraphs in their editor, and a line break in the source becomes a space in the page: right between Latin words, wrong in the middle of a sentence written without spaces. CSS Text Level 3 tells browsers to drop such a break (segment break transformation), and Chromium does not, so the plugins remove it from the HTML. The rule is the one `markdown-it-cjk-breaks` implements; the character on each side is the one the reader sees next to the break, read through inline markup. `cjkBreakRemoved` is the rule for all three engines, and `removeCjkBreaks` applies it to an mdast tree for the remark and Sätteri plugins.
import { codePointBefore, isEastAsianWide, isHangul } from "./cjk.js";
import { carryEscapes, textEscapes, type TextLikeNode } from "./escapes.js";

const ZERO_WIDTH_SPACE = 0x200b;

// Korean puts spaces between words, as Latin does: its line breaks stay.
const joins = (codePoint: number): boolean =>
  isEastAsianWide(codePoint) && !isHangul(codePoint);

/**
 * Whether the soft line break between `before` and `after` is removed: when the character on either side is the zero-width space U+200B (which stays), or when both have East Asian Width W, F or H and neither is Hangul. `before` is text that ends at the break and `after` text that starts after it; only the character next to the break is read. `undefined`, or an empty string, is a side with no character: the start or end of the block, or something that is not text (an image, raw HTML, a hard break). A wide emoji counts as wide: the rule reads East Asian Width alone.
 */
export const cjkBreakRemoved = (
  before: string | undefined,
  after: string | undefined
): boolean => {
  const last =
    before === undefined ? undefined : codePointBefore(before, before.length);
  const next = after?.codePointAt(0);
  if (last === ZERO_WIDTH_SPACE || next === ZERO_WIDTH_SPACE) return true;
  return last !== undefined && next !== undefined && joins(last) && joins(next);
};

/** A node of an mdast tree, as far as removing its CJK breaks reads and writes it. */
export interface CjkBreakNode extends TextLikeNode {
  children?: readonly CjkBreakNode[] | undefined;
}

/** How an engine writes the changes to its tree. */
export interface CjkBreakWriter {
  /** Give a text node its value without the removed breaks, and its `data`, which records the characters that were escaped when it holds any (see `carryEscapes`). */
  text: (node: CjkBreakNode, value: string, data: object | undefined) => void;
  /** Give a parent its children without the text nodes that held nothing but a removed break. */
  children: (parent: CjkBreakNode, children: CjkBreakNode[]) => void;
}

// Inline markup that wraps content the reader sees in place, so the character next to a break can be inside it: emphasis, strong, strikethrough and links, and the spans of the Mirrordown sets (mark, ins, del, spoiler, sub, sup, kbd, ruby, tags, abbr). Sätteri's spoiler holds its content in a `spoilerContent` node of its own.
const WRAPPERS = new Set([
  `emphasis`,
  `strong`,
  `delete`,
  `link`,
  `linkReference`,
  `mark`,
  `insert`,
  `spoiler`,
  `spoilerContent`,
  `subscript`,
  `superscript`,
  `kbd`,
  `ruby`,
  `tag`,
  `abbr`
]);

// Nodes inside a wrapper that show no character in the line: a ruby's reading and its fallback parentheses sit over the base text, not beside it, and Sätteri's spoiler toggle is a checkbox.
const SKIPPED = new Set([`rt`, `rp`, `spoilerToggle`]);

// What a node shows at one of its ends: a character, `undefined` for a node that is not text, or `THROUGH` for one that shows nothing there (an empty text node, a wrapper with nothing in it, a reading), so the search goes on past it.
const THROUGH = Symbol(`through`);
type Seen = string | undefined | typeof THROUGH;

const LINE_ENDING = /\r\n|\r|\n/g;

// The character that starts at `index` of a non-empty `value`, or ends there.
const after = (value: string, index: number): string =>
  String.fromCodePoint(value.codePointAt(index)!);
const before = (value: string, index: number): string =>
  String.fromCodePoint(codePointBefore(value, index)!);

// The character `node` shows at its end (`fromEnd`) or its start. Where that is the line ending of another break (across a link with nothing in it), it is neither wide nor U+200B, so it decides as markdown-it's plugin does by counting a soft break token as no character.
const edge = (node: CjkBreakNode, fromEnd: boolean): Seen => {
  if (SKIPPED.has(node.type)) return THROUGH;
  if (node.type === `text`) {
    const value = typeof node.value === `string` ? node.value : ``;
    if (value === ``) return THROUGH;
    return fromEnd ? before(value, value.length) : after(value, 0);
  }
  // A code span counts by its own content.
  if (node.type === `inlineCode`) {
    const value = typeof node.value === `string` ? node.value : ``;
    if (value === ``) return undefined;
    return fromEnd ? before(value, value.length) : after(value, 0);
  }
  if (!WRAPPERS.has(node.type)) return undefined;
  const children = node.children ?? [];
  for (let i = 0; i < children.length; i++) {
    const seen = edge(
      children[fromEnd ? children.length - 1 - i : i]!,
      fromEnd
    );
    if (seen !== THROUGH) return seen;
  }
  return THROUGH;
};

// One parent on the way down to a text node, and the index of the child the way goes on through.
interface Step {
  node: CjkBreakNode;
  index: number;
}

// The character the reader sees just outside the node at the end of `path`, before it (`backwards`) or after it: in its siblings, then, where its parent is a wrapper, in the parent's siblings, and so on up. The start or end of a block (any parent that is not a wrapper) is not a character.
const beside = (
  path: readonly Step[],
  backwards: boolean
): string | undefined => {
  for (let depth = path.length - 1; depth >= 0; depth--) {
    const { node, index } = path[depth]!;
    const children = node.children ?? [];
    const step = backwards ? -1 : 1;
    for (let i = index + step; i >= 0 && i < children.length; i += step) {
      const seen = edge(children[i]!, backwards);
      if (seen !== THROUGH) return seen;
    }
    if (!WRAPPERS.has(node.type)) return undefined;
  }
  return undefined;
};

/**
 * Remove the CJK breaks of an mdast tree (see {@link cjkBreakRemoved}): the line endings in its text nodes whose neighbours, read through inline markup, are two wide characters or a zero-width space. Every break is decided on the tree as it came, then the changes are written through `write`, so the engine keeps its own nodes. A text node that held only a removed break is taken out of its parent. `source` is the document the tree's positions refer to: the characters of a rebuilt text node that were escaped (`\*`) or written as character references are recorded on it, so a plugin that runs later still tells them from markup.
 */
export const removeCjkBreaks = (
  root: CjkBreakNode,
  source: string,
  write: CjkBreakWriter
): void => {
  const texts: Array<{
    node: CjkBreakNode;
    parent: CjkBreakNode;
    old: string;
    removed: Array<{ start: number; end: number }>;
  }> = [];
  const path: Step[] = [];
  const visit = (parent: CjkBreakNode): void => {
    const children = parent.children ?? [];
    const step: Step = { node: parent, index: 0 };
    path.push(step);
    for (let index = 0; index < children.length; index++) {
      step.index = index;
      const child = children[index]!;
      if (child.children) {
        visit(child);
        continue;
      }
      if (child.type !== `text` || typeof child.value !== `string`) continue;
      const value = child.value;
      const removed: Array<{ start: number; end: number }> = [];
      for (const match of value.matchAll(LINE_ENDING)) {
        const start = match.index;
        const end = start + match[0].length;
        if (
          cjkBreakRemoved(
            start > 0 ? before(value, start) : beside(path, true),
            end < value.length ? after(value, end) : beside(path, false)
          )
        )
          removed.push({ start, end });
      }
      if (removed.length > 0)
        texts.push({ node: child, parent, old: value, removed });
    }
    path.pop();
  };
  visit(root);

  const emptied = new Map<CjkBreakNode, Set<CjkBreakNode>>();
  for (const { node, parent, old, removed } of texts) {
    let value = ``;
    let from = 0;
    for (const { start, end } of removed) {
      value += old.slice(from, start);
      from = end;
    }
    value += old.slice(from);
    if (value === ``) {
      const set = emptied.get(parent) ?? new Set();
      set.add(node);
      emptied.set(parent, set);
      continue;
    }
    // Each escaped character moves back by the line endings removed before it.
    const escaped = textEscapes(
      node,
      source,
      parent.type,
      parent.children?.length === 1
    );
    const kept = new Set<number>();
    let shift = 0;
    let next = 0;
    for (const index of [...escaped].sort((a, b) => a - b)) {
      while (next < removed.length && removed[next]!.start < index) {
        shift += removed[next]!.end - removed[next]!.start;
        next++;
      }
      kept.add(index - shift);
    }
    const rebuilt: TextLikeNode = { type: `text`, value, data: node.data };
    carryEscapes(rebuilt, kept, 0);
    write.text(node, value, rebuilt.data);
  }
  for (const [parent, nodes] of emptied) {
    write.children(
      parent,
      (parent.children ?? []).filter((child) => !nodes.has(child))
    );
  }
};
