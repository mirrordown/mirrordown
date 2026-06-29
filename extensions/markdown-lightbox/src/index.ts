import type MarkdownIt from "markdown-it";
import { lightbox } from "@mirrordown/mdit-lightbox";

export const activate = (): {
  extendMarkdownIt: (md: MarkdownIt) => MarkdownIt;
} => ({
  extendMarkdownIt: (md: MarkdownIt): MarkdownIt => md.use(lightbox)
});
