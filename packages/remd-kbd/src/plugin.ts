import { visit } from "unist-util-visit";
import type { Plugin, Transformer } from "unified";
import type { Data, Parent, PhrasingContent, Root } from "mdast";
import { createKbdTransform, maskTreeEscapes } from "@mirrordown/core";

/** Optional data carried by a {@link Kbd} node. */
export interface KbdData extends Data {}

/** An mdast node for `[[key]]` syntax, rendered as a `<kbd>` element. */
export interface Kbd extends Parent {
  type: `kbd`;
  children: PhrasingContent[];
  data?: KbdData | undefined;
}

/**
 * remark plugin for keyboard-key syntax (`[[Ctrl]]`), wrapping each match in a {@link Kbd} node that renders as a `<kbd>` element. The scan is shared with markdown-it-kbd's rules and the Sätteri plugin through `@mirrordown/core`: keys nest (`[[Ctrl+[[C]]]]`), and a line ending before the closing `]]` leaves the text as is.
 */
export const remarkKbd: Plugin<[], Root> = () => {
  const transformer: Transformer<Root> = (tree, file) => {
    // Escapes are resolved before this runs; mask escaped characters so a backslash-escaped bracket is not matched, as in markdown-it.
    const source = String(file);
    const restoreEscapes = maskTreeEscapes(tree, source);
    // The scan reads the source to lay a link out as written, so it is built for each file.
    const transform = createKbdTransform<PhrasingContent>(
      {
        text: (value) => ({ type: `text`, value }),
        wrap: (children): Kbd => ({
          type: `kbd`,
          children,
          data: { hName: `kbd` }
        })
      },
      source
    );
    const seen = new WeakSet<Parent>();
    // A link is visited as well as text: its brackets can be a key's (`[[a]](b)`), and its parent may hold no text at all.
    const inline = [`text`, `link`, `linkReference`];
    visit(tree, inline, (_node, _index, parent: Parent | undefined) => {
      // Keys the scan built have already had their content scanned.
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
