import { visit } from "unist-util-visit";
import type { Plugin, Transformer } from "unified";
import type { Data, Parent, PhrasingContent, Root } from "mdast";
import {
  createDelimitedTransform,
  createHighlightMarkers,
  maskTreeEscapes,
  type MarkOptions
} from "@mirrordown/core";

export type { MarkOptions };

/** Optional data carried by a {@link Mark} node. */
export interface MarkData extends Data {}

/** An mdast node for `==highlighted==` text, rendered as a `<mark>` element. */
export interface Mark extends Parent {
  type: `mark`;
  children: PhrasingContent[];
  data?: MarkData | undefined;
}

/**
 * remark plugin for highlight syntax (`==text==`), wrapping each match in a
 * {@link Mark} node that renders as a `<mark>` element. A highlight that starts with a marker emoji names a variant in `data-highlight`: a colour emoji is removed (`==🔴text==` renders `<mark data-highlight="red">text</mark>`), a label's is kept (`==🐛 Bug==` renders `<mark data-highlight="bug">🐛 Bug</mark>`). `options.markers` adds, renames and turns off markers.
 */
export const remarkMark: Plugin<[MarkOptions?], Root> = (options = {}) => {
  const markers = createHighlightMarkers(options);
  // The scan is shared with the Sätteri plugin through @mirrordown/core.
  const transform = createDelimitedTransform<PhrasingContent>(`=`, {
    text: (value) => ({ type: `text`, value }),
    wrap: (children): Mark => {
      // Under the key the attrs plugin writes, so a `data-highlight` in an attribute block replaces it.
      const variant = markers.take(children);
      return {
        type: `mark`,
        children,
        data: variant
          ? { hName: `mark`, hProperties: { "data-highlight": variant } }
          : { hName: `mark` }
      };
    }
  });

  const transformer: Transformer<Root> = (tree, file) => {
    // Escapes are resolved before this runs; mask escaped characters so a
    // backslash-escaped delimiter is not matched, as in markdown-it.
    const source = String(file);
    const restoreEscapes = maskTreeEscapes(tree, source);
    const seen = new WeakSet<Parent>();
    visit(tree, `text`, (_node, _index, parent: Parent | undefined) => {
      // Marks the scan built have already had their content scanned.
      if (!parent || seen.has(parent) || transform.built(parent)) return;
      seen.add(parent);
      // A text node's parent holds phrasing content.
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      const children = parent.children as PhrasingContent[];
      const next = transform(children, parent.type, source);
      if (next !== children) parent.children = [...next];
      // Walk the restructured children from the start; this parent is done.
      return 0;
    });
    restoreEscapes();
  };

  return transformer;
};
