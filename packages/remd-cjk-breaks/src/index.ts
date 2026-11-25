import type { Root } from "mdast";
import type { Plugin } from "unified";
import { removeCjkBreaks } from "@mirrordown/core";

/**
 * remark plugin that removes a soft line break between two Chinese or Japanese characters, where the browser would show it as a space: both characters East Asian Width W, F or H and neither Hangul, or either one the zero-width space U+200B. The character on each side is the one the reader sees next to the break, read through emphasis, links and the Mirrordown spans; a code span counts by its own content. Hard breaks are never touched. List it after every other remark plugin: several find their syntax by the lines of a text node (tabs, steps, alerts, tags, attrs, caption and others), and a removed break is a line they no longer see. The characters a rebuilt text node had escaped stay escaped for any plugin after it, which is why it needs the file's value. The rule is shared with the markdown-it and Sätteri plugins through `@mirrordown/core`.
 */
export const remarkCjkBreaks: Plugin<[], Root> = () => (tree, file) => {
  removeCjkBreaks(tree, String(file), {
    text: (node, value, data) => {
      node.value = value;
      if (data !== node.data) node.data = data;
    },
    children: (parent, children) => {
      parent.children = children;
    }
  });
};
