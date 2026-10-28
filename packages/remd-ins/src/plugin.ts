import { visit } from "unist-util-visit";
import type { Plugin, Transformer } from "unified";
import type { Data, Parent, PhrasingContent, Root } from "mdast";
import { createDelimitedTransform, maskTreeEscapes } from "@mirrordown/core";

/** Optional data carried by an {@link Insert} node. */
export interface InsertData extends Data {}

/** An mdast node for `++inserted++` text, rendered as an `<ins>` element. */
export interface Insert extends Parent {
  type: `insert`;
  children: PhrasingContent[];
  data?: InsertData | undefined;
}

/**
 * remark plugin for insertion syntax (`++text++`), wrapping each match in an {@link Insert} node that renders as an `<ins>` element. The scan is shared with markdown-it's pairing rules and the Sätteri plugin through `@mirrordown/core`.
 */
export const remarkIns: Plugin<[], Root> = () => {
  const transform = createDelimitedTransform<PhrasingContent>(`+`, {
    text: (value) => ({ type: `text`, value }),
    wrap: (children): Insert => ({
      type: `insert`,
      children,
      data: { hName: `ins` }
    })
  });

  const transformer: Transformer<Root> = (tree, file) => {
    // Escapes are resolved before this runs; mask escaped characters so a backslash-escaped delimiter is not matched, as in markdown-it.
    const restoreEscapes = maskTreeEscapes(tree, String(file));
    const seen = new WeakSet<Parent>();
    visit(tree, `text`, (_node, _index, parent: Parent | undefined) => {
      // Spans the scan built have already had their content scanned.
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
