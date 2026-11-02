import type { Root } from "hast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";
import {
  COPY_CODE_ICONS,
  COPY_CODE_TEXT,
  copyCodeBlock,
  copyCodeIds,
  copyCodeOptedOut,
  createCopyCodeButton,
  type CopyCodeOptions,
  type CopyCodeState
} from "@mirrordown/core";

export type { CopyCodeOptions, CopyCodeState };
export { COPY_CODE_ICONS, COPY_CODE_TEXT };

/**
 * rehype plugin that adds a copy button to each code block, in its `<pre>` after the `<code>`: a `<button class="markdown-copy-code">` sending the `--copy` invoker command to the block's `<pre>`, which takes an id from a hash of its text. The button is a `raw` node, so it reaches the HTML exactly as the markdown-it and Sätteri plugins write it (stringify with `allowDangerousHtml`). The buttons render `hidden`; the client script (`@mirrordown/remd-copy-code/client`) copies and shows them. ` ```sh nocopy ` leaves a block without one. Options set the button's icons and text. Register it after plugins that replace code blocks, such as mermaid-pele. The ids and the button are shared with the markdown-it and Sätteri plugins through `@mirrordown/core`.
 */
export const rehypeCopyCode: Plugin<[CopyCodeOptions?], Root> = (
  options = {}
) => {
  const copyCodeButton = createCopyCodeButton(options);
  return (tree) => {
    const ids = copyCodeIds();
    visit(tree, `element`, (node) => {
      const block = copyCodeBlock(node);
      if (!block || copyCodeOptedOut(block.meta)) return;
      const id = ids(block.text);
      node.properties.id = id;
      // hast's types have no `raw` node without mdast-util-to-hast's augmentation, so the children are widened to take one.
      const children: Array<{ type: string; value?: string }> = node.children;
      children.push({ type: `raw`, value: copyCodeButton(id) });
    });
  };
};
