import type { PhrasingLike } from "./github-alerts/index.js";
import {
  createSpanTransform,
  type SpanNodes,
  type SpanTransform
} from "./spans.js";

// The scan behind `[[key]]`, shared by the remark and Sätteri plugins. It ports markdown-it-kbd's tokenizer: from a `[[`, it walks forward counting nested `[[` and `]]` until the depth returns to zero, gives up at a line ending, and parses the content again for nested keys. It works on one parent's children: text is scanned character by character, other nodes are opaque. One difference is inherent: markdown-it-kbd scans source text, so it claims `[[*a]]*` before emphasis is resolved, while remark and Sätteri have parsed the emphasis before a plugin runs.

type Unit<N> = { char: string } | { node: N };

const isChar = (unit: Unit<PhrasingLike> | undefined, char: string): boolean =>
  unit !== undefined && `char` in unit && unit.char === char;

/**
 * The index of the `]]` that closes the `[[` at `start`, or -1. This mirrors markdown-it-kbd's loop, which looks at each character with the one after it, starting from the opener's second `[`, and skips the second character of every pair it consumes.
 */
const findClose = <N extends PhrasingLike>(
  units: ReadonlyArray<Unit<N>>,
  start: number
): number => {
  let depth = 1;
  let skipNext = false;
  for (let i = start + 1; i < units.length; i++) {
    if (skipNext) {
      skipNext = false;
      continue;
    }
    const unit = units[i];
    const next = units[i + 1];
    if (isChar(unit, `]`) && isChar(next, `]`)) {
      depth--;
      if (depth === 0) return i;
      skipNext = true;
    } else if (isChar(unit, `[`) && isChar(next, `[`)) {
      depth++;
      skipNext = true;
    } else if (
      isChar(unit, `\n`) ||
      (unit && `node` in unit && unit.node.type === `break`)
    ) {
      return -1;
    }
  }
  return -1;
};

/** Build the `[[key]]` scan. */
export const createKbdTransform = <N extends PhrasingLike>(
  nodes: SpanNodes<N>
): SpanTransform<N> =>
  createSpanTransform(nodes, (children, _parentType, { text, wrap }) => {
    const units: Array<Unit<N>> = children.flatMap((child): Array<Unit<N>> => {
      const value = child.type === `text` ? child.value : undefined;
      return value === undefined
        ? [{ node: child }]
        : Array.from(value, (char) => ({ char }));
    });

    // Scan a stretch of units into nodes; a key's content is scanned again, as markdown-it-kbd tokenizes it.
    const scan = (
      list: ReadonlyArray<Unit<N>>
    ): { nodes: N[]; keyed: boolean } => {
      const out: N[] = [];
      let keyed = false;
      let buffer = ``;
      const flushText = (): void => {
        if (buffer) out.push(text(buffer));
        buffer = ``;
      };
      for (let i = 0; i < list.length;) {
        const unit = list[i];
        if (isChar(unit, `[`) && isChar(list[i + 1], `[`)) {
          const end = findClose(list, i);
          if (end >= 0) {
            keyed = true;
            flushText();
            out.push(wrap(scan(list.slice(i + 2, end)).nodes));
            i = end + 2;
            continue;
          }
        }
        if (unit && `char` in unit) buffer += unit.char;
        else if (unit) {
          flushText();
          out.push(unit.node);
        }
        i++;
      }
      flushText();
      return { nodes: out, keyed };
    };

    const { nodes: result, keyed } = scan(units);
    return keyed ? result : children;
  });
