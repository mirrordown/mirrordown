import type { Root } from "mdast";
import type { Plugin } from "unified";
import { processBlockIds } from "@mirrordown/core";

/**
 * remark plugin for Obsidian's block identifiers: `^id` at the very end of a paragraph, a heading or an alert's title is removed, and the block it names gets the `id` `^id`, so a link to `#^id` reaches it. A marker names its paragraph or heading, the list item its paragraph is in, the outermost quote or alert around it, or, alone in its own paragraph, the block before that paragraph. The marker is read with the file's source (a `^` escaped, or a marker with spaces after it on its line, is text), so the plugin needs the file's value. List it after the plugins that build tab panels and steps (remark-tabs, remark-steps) and after remark-attrs, and before remark-abbr and remark-caption; it can go before or after remark-github-alerts. Recognition is shared with the markdown-it and Sätteri plugins through `@mirrordown/core`.
 */
export const remarkBlockIds: Plugin<[], Root> = () => (tree, file) => {
  processBlockIds(tree, String(file));
};
