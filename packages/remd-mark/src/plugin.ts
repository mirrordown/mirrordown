import { visit } from "unist-util-visit";
import type { Plugin, Transformer } from "unified";
import type { Data, Parent, PhrasingContent, Root } from "mdast";
import {
  MARK_DELIMITERS,
  createDelimitedTransform,
  maskTreeEscapes
} from "@mirrordown/core";

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
 * {@link Mark} node that renders as a `<mark>` element.
 */
export const remarkMark: Plugin<[], Root> = () => {
  // The scan is shared with the Sätteri plugin through @mirrordown/core.
  const transform = createDelimitedTransform<PhrasingContent>(MARK_DELIMITERS, {
    text: (value) => ({ type: `text`, value }),
    wrap: (children): Mark => ({
      type: `mark`,
      children,
      data: { hName: `mark` }
    })
  });

  const transformer: Transformer<Root> = (tree, file) => {
    // Escapes are resolved before this runs; mask escaped characters so a
    // backslash-escaped delimiter is not matched, as in markdown-it.
    const restoreEscapes = maskTreeEscapes(tree, String(file));
    const seen = new WeakSet<Parent>();
    visit(tree, `text`, (_node, _index, parent: Parent | undefined) => {
      // Marks the scan built have already had their content scanned.
      if (!parent || seen.has(parent) || transform.built(parent)) return;
      seen.add(parent);
      // A text node's parent holds phrasing content.
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      parent.children = transform(parent.children as PhrasingContent[]);
      // Walk the restructured children from the start; this parent is done.
      return 0;
    });
    restoreEscapes();
  };

  return transformer;
};
