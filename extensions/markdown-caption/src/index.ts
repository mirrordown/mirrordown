import type MarkdownIt from "markdown-it";
import { caption } from "@mirrordown/mdit-caption";

export const activate = (): {
  extendMarkdownIt: (md: MarkdownIt) => MarkdownIt;
} => ({
  extendMarkdownIt: (md: MarkdownIt): MarkdownIt => md.use(caption)
});
