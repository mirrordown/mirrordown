import { visit } from "unist-util-visit";
import type { Plugin, Transformer } from "unified";
import type { Data, Parent, PhrasingContent, Root } from "mdast";
import { createDelimitedTransform, maskTreeEscapes } from "@mirrordown/core";

interface DeleteData extends Data {}

interface Delete extends Parent {
  type: `delete`;
  children: PhrasingContent[];
  data?: DeleteData | undefined;
}

// Note: `delete` is a built-in mdast node type (@types/mdast already registers `delete: Delete` in its content maps), so no module augmentation is needed — the local Delete is structurally identical and used internally.

/**
 * remark plugin for deletion syntax (`--text--`), wrapping each match in a `delete` mdast node that renders as a `<del>` element. The scan is shared with markdown-it's pairing rules and the Sätteri plugin through `@mirrordown/core`.
 */
export const remarkDel: Plugin<[], Root> = () => {
  const transform = createDelimitedTransform<PhrasingContent>(`-`, {
    text: (value) => ({ type: `text`, value }),
    wrap: (children): Delete => ({
      type: `delete`,
      children,
      data: { hName: `del` }
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
