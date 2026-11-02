import type { PluginWithOptions } from "markdown-it";
import {
  createFileTree,
  FILE_TREE_LANGUAGE,
  type FileTreeIconOptions,
  type FileTreeOptions,
  type FileTreeTheme
} from "@mirrordown/core/file-tree";

export type { FileTreeIconOptions, FileTreeOptions, FileTreeTheme };

/**
 * markdown-it plugin that renders ` ```filetree ` fences as file trees: a `<ul class="markdown-file-tree">` of rows, each folder a `<details>` whose `<summary>` is its row, with Seti icons, git status marks and comments. Rows nest by indentation or by the branches the `tree` command draws, so the fence reads as a tree where the plugin isn't installed. Attributes on the fence (`{#id .class}`, with markdown-it-attrs) go on the `<ul>`. Options set a Shiki theme to color the trees with and icons to use. The optional client script (`@mirrordown/mdit-file-tree/client`) makes each tree an ARIA tree, navigated with the arrow keys. The tree is shared with the rehype and Sätteri plugins through `@mirrordown/core`.
 */
export const fileTree: PluginWithOptions<FileTreeOptions> = (
  md,
  options = {}
) => {
  const render = createFileTree(options);
  const renderFence = md.renderer.rules.fence;
  md.renderer.rules.fence = (tokens, idx, opts, env, self): string => {
    const token = tokens[idx];
    const lang = md.utils
      .unescapeAll(token?.info ?? ``)
      .trim()
      .split(/\s+/)[0];
    const html =
      token && lang === FILE_TREE_LANGUAGE
        ? render(token.content, token.attrs ?? [])
        : undefined;
    if (html !== undefined) return `${html}\n`;
    return renderFence
      ? renderFence(tokens, idx, opts, env, self)
      : self.renderToken(tokens, idx, opts);
  };
};
