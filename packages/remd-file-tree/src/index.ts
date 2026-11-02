import type { Element, Root } from "hast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";
import { hastAttributes } from "@mirrordown/core";
import {
  createFileTree,
  fileTreeBlock,
  type FileTreeIconOptions,
  type FileTreeOptions,
  type FileTreeTheme
} from "@mirrordown/core/file-tree";

export type { FileTreeIconOptions, FileTreeOptions, FileTreeTheme };

// Turn the <pre> into a raw node in place, as remd-mermaid-pele does: the tree reaches the HTML byte-for-byte (as in mdit-file-tree), and hast's types have no `raw` node without mdast-util-to-hast's augmentation.
const toRaw = (pre: Element, value: string): void => {
  const node: {
    type: string;
    tagName?: string;
    properties?: unknown;
    children?: unknown;
    value?: string;
  } = pre;
  delete node.tagName;
  delete node.properties;
  delete node.children;
  node.type = `raw`;
  node.value = value;
};

/**
 * rehype plugin that renders ` ```filetree ` fences as file trees: a `<ul class="markdown-file-tree">` of rows, each folder a `<details>` whose `<summary>` is its row, with Seti icons, git status marks and comments. Rows nest by indentation or by the branches the `tree` command draws, so the fence reads as a tree where the plugin isn't installed. The tree replaces the `<pre>` as a `raw` node, so it reaches the HTML exactly as the markdown-it and Sätteri plugins write it (stringify with `allowDangerousHtml`); attributes on the fence (`{#id .class}`, with remark-attrs) go on the `<ul>`. Options set a Shiki theme to color the trees with and icons to use. Register it before copy-code. The optional client script (`@mirrordown/remd-file-tree/client`) makes each tree an ARIA tree, navigated with the arrow keys. The tree is shared with the markdown-it and Sätteri plugins through `@mirrordown/core`.
 */
export const rehypeFileTree: Plugin<[FileTreeOptions?], Root> = (
  options = {}
) => {
  const render = createFileTree(options);
  return (tree) => {
    visit(tree, `element`, (node, index) => {
      const block = fileTreeBlock(node);
      if (!block) return;
      const html = render(
        block.source,
        hastAttributes(block.element.properties)
      );
      if (html === undefined) return;
      toRaw(node, html);
      return index === undefined ? undefined : index + 1;
    });
  };
};
