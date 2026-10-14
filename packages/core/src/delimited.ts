import type { PhrasingLike } from "./github-alerts/index.js";
import {
  createSpanTransform,
  type SpanNodes,
  type SpanTransform
} from "./spans.js";

// The scan behind `==mark==`, `++ins++` and `--del--`, shared by the remark and Sätteri plugins. It ports markdown-it's delimiter algorithm (the one markdown-it-mark and markdown-it-ins use), so all three engines pair delimiters the same way: runs of the marker split into two-character delimiters that open or close by emphasis-style flanking, each closer pairs with the nearest open opener, pairs nest, and the odd marker of an odd-length run stays outside the tag. It works on one parent's children: text is scanned, other nodes are opaque. It is pure; remark runs it on mutable nodes, Sätteri on read-only ones (it builds new nodes and reuses the rest).

/** A marker whose doubled form delimits a span: `==`, `++` or `--`. */
export type DelimiterMarker = `=` | `+` | `-`;

// What markdown-it sees beside a run at the edge of a text node: inside an inline parent, that parent's own delimiter (`*`, `[`, `~`…), which is punctuation; at the edge of a block's inline content, the space markdown-it assumes there.
const INLINE_PARENTS = new Set([
  `delete`,
  `emphasis`,
  `insert`,
  `link`,
  `linkReference`,
  `mark`,
  `strong`,
  `subscript`,
  `superscript`
]);

type CharClass = `space` | `punct` | `other`;

// markdown-it's isWhiteSpace, and isMdAsciiPunct || isPunctChar (Unicode P and S).
const WHITESPACE =
  /^[\t\n\v\f\r \u00a0\u1680\u2000-\u200a\u202f\u205f\u3000]$/u;
const PUNCTUATION = /^[\p{P}\p{S}]$/u;
const classify = (char: string): CharClass =>
  WHITESPACE.test(char) ? `space` : PUNCTUATION.test(char) ? `punct` : `other`;

interface Delimiter {
  open: boolean;
  close: boolean;
  /** Index of the paired closer in the delimiter list, or -1. */
  end: number;
  /** Index among the items; consecutive values are delimiters of one run. */
  item: number;
}

type Item<N> =
  | { kind: `text`; value: string }
  | { kind: `node`; node: N }
  | { kind: `delimiter` }
  | { kind: `opening` }
  | { kind: `closing` };

/**
 * markdown-it's `balance_pairs` for a single marker. Every delimiter has `length: 0`, as in markdown-it-mark, so the emphasis "rule of 3" never applies.
 */
const balancePairs = (delimiters: Delimiter[]): void => {
  const jumps: number[] = [];
  const openersBottom = [-1, -1, -1, -1, -1, -1];
  let headerIdx = 0;
  let lastItem = -2;
  delimiters.forEach((closer, closerIdx) => {
    jumps.push(0);
    if (lastItem !== closer.item - 1) headerIdx = closerIdx;
    lastItem = closer.item;
    if (!closer.close) return;
    const bottom = closer.open ? 3 : 0;
    const minOpenerIdx = openersBottom[bottom] ?? -1;
    let openerIdx = headerIdx - (jumps[headerIdx] ?? 0) - 1;
    let newMinOpenerIdx = openerIdx;
    for (; openerIdx > minOpenerIdx; openerIdx -= (jumps[openerIdx] ?? 0) + 1) {
      const opener = delimiters[openerIdx];
      if (!opener?.open || opener.end >= 0) continue;
      const lastJump =
        openerIdx > 0 && delimiters[openerIdx - 1]?.open === false
          ? (jumps[openerIdx - 1] ?? 0) + 1
          : 0;
      jumps[closerIdx] = closerIdx - openerIdx + lastJump;
      jumps[openerIdx] = lastJump;
      closer.open = false;
      opener.end = closerIdx;
      opener.close = false;
      newMinOpenerIdx = -1;
      lastItem = -2;
      break;
    }
    if (newMinOpenerIdx !== -1) openersBottom[bottom] = newMinOpenerIdx;
  });
};

/** Build the delimiter scan for one marker: `=` (mark), `+` (ins) or `-` (del). */
export const createDelimitedTransform = <N extends PhrasingLike>(
  marker: DelimiterMarker,
  nodes: SpanNodes<N>
): SpanTransform<N> =>
  createSpanTransform(nodes, (children, parentType, { text, wrap }) => {
    const edge: CharClass = INLINE_PARENTS.has(parentType) ? `punct` : `space`;
    // The character class beside a text node, from its sibling: a break is a line ending; any other node ends in its own delimiter or markup.
    const beside = (
      node: N | undefined,
      side: `before` | `after`
    ): CharClass => {
      if (!node) return edge;
      if (node.type === `text` && node.value) {
        return classify(
          side === `before` ? node.value.slice(-1) : node.value.charAt(0)
        );
      }
      return node.type === `break` ? `space` : `punct`;
    };

    // markdown-it-mark's tokenizer: text between runs is one item, as markdown-it's pending text becomes one token.
    const items: Array<Item<N>> = [];
    const delimiters: Delimiter[] = [];
    children.forEach((child, index) => {
      const value = child.type === `text` ? child.value : undefined;
      if (value === undefined) {
        items.push({ kind: `node`, node: child });
        return;
      }
      let pending = ``;
      const flush = (): void => {
        if (pending) items.push({ kind: `text`, value: pending });
        pending = ``;
      };
      let i = 0;
      while (i < value.length) {
        let end = i;
        while (value.charAt(end) === marker) end++;
        if (end - i < 2) {
          pending += value.slice(i, Math.max(end, i + 1));
          i = Math.max(end, i + 1);
          continue;
        }
        const last =
          i > 0
            ? classify(value.charAt(i - 1))
            : beside(children[index - 1], `before`);
        const next =
          end < value.length
            ? classify(value.charAt(end))
            : beside(children[index + 1], `after`);
        const open = next !== `space` && (next !== `punct` || last !== `other`);
        const close =
          last !== `space` && (last !== `punct` || next !== `other`);
        flush();
        let length = end - i;
        if (length % 2) {
          items.push({ kind: `text`, value: marker });
          length--;
        }
        for (let pair = 0; pair < length; pair += 2) {
          if (open || close) {
            delimiters.push({ open, close, end: -1, item: items.length });
            items.push({ kind: `delimiter` });
          } else {
            items.push({ kind: `text`, value: marker + marker });
          }
        }
        i = end;
      }
      flush();
    });

    balancePairs(delimiters);
    if (!delimiters.some(({ end }) => end >= 0)) return children;

    // markdown-it-mark's postProcess: paired delimiters become tags, and the odd marker of an odd-length closing run moves after the closing tags.
    const lone: number[] = [];
    for (const delimiter of delimiters) {
      const closer = delimiters[delimiter.end];
      if (!closer) continue;
      items[delimiter.item] = { kind: `opening` };
      items[closer.item] = { kind: `closing` };
      const previous = items[closer.item - 1];
      if (previous?.kind === `text` && previous.value === marker) {
        lone.push(closer.item - 1);
      }
    }
    for (const i of lone.reverse()) {
      let j = i + 1;
      while (items[j]?.kind === `closing`) j++;
      j--;
      const moved = items[i];
      const target = items[j];
      if (i !== j && moved && target) {
        items[i] = target;
        items[j] = moved;
      }
    }

    // Fold the flat items into nested wrappers, merging adjacent text.
    const root: N[] = [];
    const stack: N[][] = [root];
    let buffer = ``;
    const append = (node: N): void => {
      (stack.at(-1) ?? root).push(node);
    };
    const flushText = (): void => {
      if (!buffer) return;
      append(text(buffer));
      buffer = ``;
    };
    for (const item of items) {
      if (item.kind === `text`) {
        buffer += item.value;
      } else if (item.kind === `delimiter`) {
        buffer += marker + marker;
      } else if (item.kind === `node`) {
        flushText();
        append(item.node);
      } else if (item.kind === `opening`) {
        flushText();
        stack.push([]);
      } else {
        flushText();
        append(wrap(stack.pop() ?? []));
      }
    }
    flushText();
    return root;
  });
