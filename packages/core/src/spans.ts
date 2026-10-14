import { escapedIndices, maskEscaped, unmaskEscaped } from "./escapes.js";
import type { PhrasingLike } from "./github-alerts/index.js";

// The plumbing shared by core's inline span scans (`delimited.ts`, `kbd.ts`): tracking the nodes a scan builds, and masking escaped characters for engines whose nodes are read-only.

/** How a scanned span becomes nodes. */
export interface SpanNodes<N extends PhrasingLike> {
  /** A text node with the given value. */
  text: (value: string) => N;
  /** The node a span's content is wrapped in (e.g. an mdast `mark`). */
  wrap: (children: N[]) => N;
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

/** A scan over one parent's children, and the nodes it created. */
export interface SpanTransform<N extends PhrasingLike> {
  /** Scan `children`, the children of a node of type `parentType`. Returns `children` itself when no span forms. */
  (children: readonly N[], parentType?: string): readonly N[];
  /** Whether `node` was built by this transform (a wrapper or a text node). */
  built: (node: object) => boolean;
  /**
   * The transform for engines whose text values have escapes resolved and whose nodes are read-only, such as Sätteri: escaped characters are masked by aligning each positioned text node with `source`, using copies, and restored in the result. Returns the new children, or `undefined` when no span forms.
   */
  withSource: (
    children: ReadonlyArray<N & Positioned>,
    parentType: string,
    source: string
  ) => N[] | undefined;
}

/** A scan, given node builders that record what they build. */
export type SpanScan<N extends PhrasingLike> = (
  children: readonly N[],
  parentType: string,
  nodes: SpanNodes<N>
) => readonly N[];

/** Wrap a scan with built-node tracking and source-based escape masking. */
export const createSpanTransform = <N extends PhrasingLike>(
  nodes: SpanNodes<N>,
  scan: SpanScan<N>
): SpanTransform<N> => {
  const built = new WeakSet<object>();
  // Each wrapper's content, kept typed for restoring masked escapes.
  const contents = new WeakMap<object, N[]>();
  const tracked: SpanNodes<N> = {
    text: (value) => {
      const node = nodes.text(value);
      built.add(node);
      return node;
    },
    wrap: (children) => {
      const node = nodes.wrap(children);
      built.add(node);
      contents.set(node, children);
      return node;
    }
  };

  const transform = (children: readonly N[], parentType = ``): readonly N[] =>
    scan(children, parentType, tracked);

  const restore = (list: readonly N[]): void => {
    for (const node of list) {
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
      return escaped.size === 0
        ? node
        : tracked.text(maskEscaped(node.value, escaped));
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
