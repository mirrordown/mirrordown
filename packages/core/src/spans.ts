import type { Properties } from "hast";
import type { ReadAttributes } from "./cut-attributes.js";
import {
  maskEscaped,
  restoreText,
  textEscapes,
  type TextLikeNode
} from "./escapes.js";
import type { PhrasingLike } from "./github-alerts/index.js";
import {
  addProperties,
  claimTrailingAttributes,
  leadingAttributes
} from "./span-attributes.js";

// The plumbing shared by core's inline span scans (`delimited.ts`, `kbd.ts`): tracking the nodes a scan builds, and masking escaped characters for engines whose nodes are read-only.

/** How a scanned span becomes nodes. */
export interface SpanNodes<N extends PhrasingLike> {
  /** A text node with the given value. */
  text: (value: string) => N;
  /** The node a span's content is wrapped in (e.g. an mdast `mark`). */
  wrap: (children: N[]) => N;
  /** Gives a wrapper the attributes of the blocks written right after it (see `withSource`). By default they join its `data.hProperties`. */
  attributes?: (wrapper: N, properties: Properties) => void;
}

/** A node's source range, as unist positions carry it, and the `data` a rebuilt text node keeps its literal characters in. */
export type Positioned = Pick<TextLikeNode, `position` | `data`>;

/** A scan over one parent's children, and the nodes it created. */
export interface SpanTransform<N extends PhrasingLike> {
  /** Scan `children`, the children of a node of type `parentType`. Returns `children` itself when no span forms. */
  (children: readonly N[], parentType?: string): readonly N[];
  /** Whether `node` was built by this transform (a wrapper or a text node). */
  built: (node: object) => boolean;
  /** Gives a wrapper this transform built the attributes of a block written right after it. */
  attributes: (wrapper: N, properties: Properties) => void;
  /**
   * The transform for engines whose text values have escapes resolved and whose nodes are read-only, such as Sätteri: escaped characters are masked by aligning each positioned text node with `source`, using copies, and restored in the result. The text nodes of the result record their escaped characters in `data.escaped`, so the next plugin's scan still finds them. Returns the new children, or `undefined` when no span forms. Pass `inTableCell` when the children are inside a table cell that is not their parent, where `\|` is the table's pipe and not an escape. Pass `read` when the parser read the document's attribute blocks before the spans existed: each span then takes the blocks written right after it, which the parser left as text.
   */
  withSource: (
    children: ReadonlyArray<N & Positioned>,
    parentType: string,
    source: string,
    inTableCell?: boolean,
    read?: ReadAttributes
  ) => N[] | undefined;
}

/** A node whose children a span transform scans, in a tree whose nodes are read-only. */
export type SpanParent<N extends PhrasingLike> = Positioned & {
  type: string;
  children: ReadonlyArray<N & Positioned>;
};

/** What {@link scanSpans} needs of the tree a parent is in. */
export interface SpanHost<N extends PhrasingLike, P extends SpanParent<N>> {
  /** The document the nodes' positions refer to. */
  source: string;
  /** Reads an attribute block as the parser does, when the document has attribute blocks turned on (see `createAttributeReader`). */
  read?: ReadAttributes | undefined;
  /** The parent of a node, or `undefined` at the root. */
  parent: (node: P) => P | undefined;
  /** Replaces a node's children. */
  setChildren: (node: P, children: N[]) => void;
  /** Replaces a node's `data`. */
  setData: (node: P, data: Record<string, unknown>) => void;
}

/**
 * Runs `transform` over the children of `parent`, a node of a read-only tree (Sätteri's), and writes the result back through `host`. In a table cell, however far up, `\|` is the table's way to write a pipe and not an escape. With `host.read`, a span takes the attribute blocks written right after it: those in the middle of the content, which the parser left as text, and the one that ends it, which the parser gave to the parent or to the block that holds it (see `claimTrailingAttributes`).
 */
export const scanSpans = <N extends PhrasingLike, P extends SpanParent<N>>(
  transform: SpanTransform<N>,
  parent: P,
  { source, read, parent: parentOf, setChildren, setData }: SpanHost<N, P>
): void => {
  let inTableCell = false;
  for (
    let ancestor: P | undefined = parent;
    ancestor && !inTableCell;
    ancestor = parentOf(ancestor)
  ) {
    inTableCell = ancestor.type === `tableCell`;
  }
  const children = transform.withSource(
    parent.children,
    parent.type,
    source,
    inTableCell,
    read
  );
  if (!children) return;
  const last = children.at(-1);
  const start = parent.position?.start.offset;
  const end = parent.position?.end.offset;
  if (
    read &&
    last &&
    last.type !== `text` &&
    transform.built(last) &&
    start !== undefined &&
    end !== undefined
  ) {
    const claimed = claimTrailingAttributes(
      source.slice(start, end),
      parent.type,
      [parent, parentOf(parent)],
      read
    );
    if (claimed) {
      setData(claimed.holder, claimed.data);
      transform.attributes(last, claimed.properties);
    }
  }
  setChildren(parent, children);
};

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
  const attributes = nodes.attributes ?? addProperties;
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
      if (node.type === `text`) {
        restoreText(node);
      } else {
        restore(contents.get(node) ?? []);
      }
    }
  };

  // Each span built in `list` takes the attribute blocks that open the text after it, while that text is still masked: an escaped `{` opens nothing.
  const takeAttributes = (list: N[], read: ReadAttributes): void => {
    for (const [index, node] of list.entries()) {
      if (node.type === `text` || !built.has(node)) continue;
      takeAttributes(contents.get(node) ?? [], read);
      const after = list[index + 1];
      if (after?.type !== `text` || after.value === undefined) continue;
      const taken = leadingAttributes(after.value, read);
      if (!taken) continue;
      attributes(node, taken.properties);
      list.splice(
        index + 1,
        1,
        ...(taken.rest ? [tracked.text(taken.rest)] : [])
      );
    }
  };

  const withSource = (
    children: ReadonlyArray<N & Positioned>,
    parentType: string,
    source: string,
    inTableCell = parentType === `tableCell`,
    read?: ReadAttributes
  ): N[] | undefined => {
    const masked = children.map((node): N => {
      if (node.type !== `text` || node.value === undefined) return node;
      const value = maskEscaped(
        node.value,
        textEscapes(
          node,
          source,
          parentType,
          children.length === 1,
          inTableCell
        )
      );
      return value === node.value ? node : tracked.text(value);
    });
    const next = transform(masked, parentType);
    if (next === masked) return undefined;
    const result = [...next];
    if (read) takeAttributes(result, read);
    restore(result);
    return result;
  };

  return Object.assign(transform, {
    built: (node: object) => built.has(node),
    attributes,
    withSource
  });
};
