import { escapedIndices, maskEscaped, unmaskEscaped } from "./escapes.js";
import type { PhrasingLike } from "./github-alerts/index.js";

// The scan behind `==mark==`, `++ins++` and `--del--`, shared by the remark and Sätteri plugins. It ports markdown-it's delimiter algorithm (the one markdown-it-mark and markdown-it-ins use), so all three engines pair delimiters the same way: runs of the marker split into two-character delimiters that open or close by emphasis-style flanking, each closer pairs with the nearest open opener, pairs nest, and the odd marker of an odd-length run stays outside the tag. It works on one parent's children: text is scanned, other nodes are opaque. It is pure; remark runs it on mutable nodes, Sätteri on read-only ones (it builds new nodes and reuses the rest).

/** A marker whose doubled form delimits a span: `==`, `++` or `--`. */
export type DelimiterMarker = `=` | `+` | `-`;

/** How a delimited span becomes nodes. */
export interface DelimitedNodes<N extends PhrasingLike> {
  /** A text node with the given value. */
  text: (value: string) => N;
  /** The node a span's content is wrapped in (e.g. an mdast `mark`). */
  wrap: (children: N[]) => N;
}

/** Transform a parent's children, and report which nodes it created. */
export interface DelimitedTransform<N extends PhrasingLike> {
  /** Pair the delimiters among `children`, the children of a node of type `parentType`. Returns `children` itself when nothing pairs. */
  (children: readonly N[], parentType?: string): readonly N[];
  /** Whether `node` was built by this transform (a wrapper or a text node). */
  built: (node: object) => boolean;
  /**
   * The transform for engines whose text values have escapes resolved and whose nodes are read-only, such as Sätteri: escaped markers are masked by aligning each positioned text node with `source`, using copies, and restored in the result. Returns the new children, or `undefined` when nothing pairs.
   */
  withSource: (
    children: ReadonlyArray<N & Positioned>,
    parentType: string,
    source: string
  ) => N[] | undefined;
}

/** A node's source range, as unist positions carry it. */
export interface Positioned {
  position?:
    | {
        start: { offset?: number | undefined };
        end: { offset?: number | undefined };
      }
    | undefined;
}

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
const WHITESPACE = /^[\t\n\v\f\r    -   　]$/u;
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
  nodes: DelimitedNodes<N>
): DelimitedTransform<N> => {
  const built = new WeakSet<object>();
  // Each wrapper's content, kept typed for restoring masked escapes.
  const contents = new WeakMap<object, N[]>();

  const transform = (children: readonly N[], parentType = ``): readonly N[] => {
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
      const node = nodes.text(buffer);
      built.add(node);
      append(node);
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
        const content = stack.pop() ?? [];
        const wrapper = nodes.wrap(content);
        built.add(wrapper);
        contents.set(wrapper, content);
        append(wrapper);
      }
    }
    flushText();
    return root;
  };

  const restore = (nodes: readonly N[]): void => {
    for (const node of nodes) {
      if (!built.has(node)) continue;
      if (node.type === `text` && node.value !== undefined) {
        node.value = unmaskEscaped(node.value);
      } else {
        restore(contents.get(node) ?? []);
      }
    }
  };

  const withSource = (
    children: ReadonlyArray<N & Positioned>,
    parentType: string,
    source: string
  ): N[] | undefined => {
    const masked = children.map((node): N => {
      const start = node.position?.start.offset;
      const end = node.position?.end.offset;
      if (
        node.type !== `text` ||
        node.value === undefined ||
        start === undefined ||
        end === undefined
      )
        return node;
      const escaped = escapedIndices(node.value, source, start, end);
      if (escaped.size === 0) return node;
      const copy = nodes.text(maskEscaped(node.value, escaped));
      built.add(copy);
      return copy;
    });
    const next = transform(masked, parentType);
    if (next === masked) return undefined;
    restore(next);
    return [...next];
  };

  return Object.assign(transform, {
    built: (node: object) => built.has(node),
    withSource
  });
};
