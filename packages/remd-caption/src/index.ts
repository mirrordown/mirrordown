import type { Root } from "mdast";
import type { Plugin } from "unified";
import { processCaptions } from "@mirrordown/core";

/**
 * remark plugin that captions a block with a `~:` line right after it: the block goes in a `<figure class="markdown-caption">` whose `<figcaption>` holds the caption, which runs to the end of its paragraph and can hold inline markdown. An image alone in its paragraph is the figure's content itself. Caption lines are found and placed by the document's source (the `>` markers and indentation a line is written with decide which block it captions), so the plugin needs the file's value. List it after remark-attrs (attributes ending a caption go on the figure) and the container plugins (tabs, steps, alerts, definition lists). Recognition is shared with the markdown-it and Sätteri plugins through `@mirrordown/core`.
 */
export const remarkCaption: Plugin<[], Root> = () => (tree, file) => {
  processCaptions(tree, String(file));
};
