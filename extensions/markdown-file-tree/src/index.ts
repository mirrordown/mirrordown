import type MarkdownIt from "markdown-it";
import { fileTree } from "@mirrordown/mdit-file-tree";

// No theme option: the stylesheet takes the editor theme's colors from the preview.
export const activate = (): {
  extendMarkdownIt: (md: MarkdownIt) => MarkdownIt;
} => ({
  extendMarkdownIt: (md: MarkdownIt): MarkdownIt => md.use(fileTree)
});
