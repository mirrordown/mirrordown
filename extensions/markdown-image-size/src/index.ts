import type MarkdownIt from "markdown-it";
import { imageSize } from "@mirrordown/mdit-image-size";

export const activate = (): {
  extendMarkdownIt: (md: MarkdownIt) => MarkdownIt;
} => ({
  extendMarkdownIt: (md: MarkdownIt): MarkdownIt => md.use(imageSize)
});
