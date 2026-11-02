import { hastAttributes } from "@mirrordown/core";
import {
  createFileTree,
  fileTreeBlock,
  type FileTreeIconOptions,
  type FileTreeOptions,
  type FileTreeTheme
} from "@mirrordown/core/file-tree";
import {
  defineHastPlugin,
  type HastVisitorInstance,
  type PluginFactoryContext
} from "satteri";

export type { FileTreeIconOptions, FileTreeOptions, FileTreeTheme };

type ElementVisitor = Extract<
  NonNullable<HastVisitorInstance["element"]>,
  { filter: string[] }
>;

/**
 * The plugin's definition: only the keys it defines, with a synchronous visitor, so `markdownToHtml` returns its result directly.
 */
export interface FileTreePlugin {
  name: string;
  element: {
    filter: string[];
    visit: (...args: Parameters<ElementVisitor["visit"]>) => void;
  };
}

/**
 * Sätteri plugin that renders ` ```filetree ` fences as file trees: a `<ul class="markdown-file-tree">` of rows, each folder a `<details>` whose `<summary>` is its row, with Seti icons, git status marks and comments. Rows nest by indentation or by the branches the `tree` command draws, so the fence reads as a tree where the plugin isn't installed. The tree replaces the `<pre>` as a `raw` node, so it reaches the HTML exactly as the markdown-it and rehype plugins write it; attributes on the fence (`{#id .class}`, with the `attributes` feature) go on the `<ul>`. Options set a Shiki theme to color the trees with and icons to use. List it before copy-code. The optional client script (`@mirrordown/sat-file-tree/client`) makes each tree an ARIA tree, navigated with the arrow keys. The tree is shared with the markdown-it and rehype plugins through `@mirrordown/core`.
 */
export const satteriFileTree = (
  options: FileTreeOptions = {}
): ((ctx: PluginFactoryContext) => FileTreePlugin) => {
  const render = createFileTree(options);
  return () =>
    defineHastPlugin({
      name: `file-tree`,
      element: {
        filter: [`pre`],
        visit(node, ctx) {
          const block = fileTreeBlock(node);
          if (!block) return;
          const html = render(
            block.source,
            hastAttributes(block.element.properties)
          );
          if (html !== undefined)
            ctx.replaceNode(node, { type: `raw`, value: html });
        }
      }
    });
};
