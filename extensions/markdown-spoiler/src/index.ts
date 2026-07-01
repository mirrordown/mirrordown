import type MarkdownIt from "markdown-it";
import { spoiler } from "@mirrordown/mdit-spoiler";

export const activate = (): {
  extendMarkdownIt: (md: MarkdownIt) => MarkdownIt;
} => ({
  extendMarkdownIt: (md: MarkdownIt): MarkdownIt => md.use(spoiler)
});
