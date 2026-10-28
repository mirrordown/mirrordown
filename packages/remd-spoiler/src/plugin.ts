import { visit } from "unist-util-visit";
import type { Plugin, Transformer } from "unified";
import type { Data, Parent, PhrasingContent, Root } from "mdast";
import type { Element, ElementContent, Properties } from "hast";
import { createDelimitedTransform, maskTreeEscapes } from "@mirrordown/core";

/** Optional data carried by a {@link Spoiler} node. */
export interface SpoilerData extends Data {}

/**
 * An mdast node for `||spoiler||` text, rendered as a click-to-reveal spoiler
 * (a `<label>` wrapping a checkbox and a content `<span>`).
 */
export interface Spoiler extends Parent {
  type: `spoiler`;
  children: PhrasingContent[];
  data?: SpoilerData | undefined;
}

// Minimal hast-handler surface. remark-rehype's real `State`/`Handler` types
// carry the whole conversion API; we only need `all()` to convert this node's
// mdast children into hast. Typed locally to avoid a dependency on
// mdast-util-to-hast just for two type names.
interface HastState {
  all: (node: Spoiler) => ElementContent[];
  patch: (from: Spoiler, to: Element) => void;
}
type SpoilerHandler = (state: HastState, node: Spoiler) => Element;

/**
 * Build the `<label><input><span>...</span></label>` hast subtree. The checkbox
 * precedes the content span so CSS's `:checked ~ .content` combinator can reach
 * it; the content is a following sibling, not a child, of the checkbox.
 */
const buildSpoilerHast = (state: HastState, node: Spoiler): Element => {
  const inputProps: Properties = {
    type: `checkbox`,
    class: `markdown-spoiler-toggle`,
    "aria-label": `spoiler`
  };
  const input: Element = {
    type: `element`,
    tagName: `input`,
    properties: inputProps,
    children: []
  };
  const content: Element = {
    type: `element`,
    tagName: `span`,
    properties: { class: `markdown-spoiler-content` },
    children: state.all(node)
  };
  const result: Element = {
    type: `element`,
    tagName: `label`,
    properties: { class: `markdown-spoiler` },
    children: [input, content]
  };
  state.patch(node, result);
  return result;
};

/** mdast-to-hast handler for spoiler nodes, for use with `remark-rehype`. */
export const spoilerHastHandlers: Record<string, SpoilerHandler> = {
  spoiler: buildSpoilerHast
};

/**
 * remark plugin for Discord-style spoiler syntax (`||text||`), wrapping each match in a {@link Spoiler} node. Pair with {@link spoilerHastHandlers} via `remarkRehype({ handlers: spoilerHastHandlers })` so the node renders as a click-to-reveal spoiler. The scan is shared with markdown-it's pairing rules and the Sätteri plugin through `@mirrordown/core`, and the output is byte-identical to `@mirrordown/mdit-spoiler`.
 */
export const remarkSpoiler: Plugin<[], Root> = () => {
  const transform = createDelimitedTransform<PhrasingContent>(`|`, {
    text: (value) => ({ type: `text`, value }),
    wrap: (children): Spoiler => ({ type: `spoiler`, children })
  });

  const transformer: Transformer<Root> = (tree, file) => {
    // Escapes are resolved before this runs; mask escaped characters so a backslash-escaped delimiter is not matched, as in markdown-it.
    const restoreEscapes = maskTreeEscapes(tree, String(file));
    const seen = new WeakSet<Parent>();
    visit(tree, `text`, (_node, _index, parent: Parent | undefined) => {
      // Spoilers the scan built have already had their content scanned.
      if (!parent || seen.has(parent) || transform.built(parent)) return;
      seen.add(parent);
      // A text node's parent holds phrasing content.
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      const children = parent.children as PhrasingContent[];
      const next = transform(children, parent.type);
      if (next !== children) parent.children = [...next];
      // Walk the restructured children from the start; this parent is done.
      return 0;
    });
    restoreEscapes();
  };

  return transformer;
};
