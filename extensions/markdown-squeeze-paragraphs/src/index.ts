import type MarkdownIt from "markdown-it";
import { squeezeParagraphs } from "@mirrordown/mdit-squeeze-paragraphs";

export const activate = (): {
  extendMarkdownIt: (md: MarkdownIt) => MarkdownIt;
} => ({
  extendMarkdownIt: (md: MarkdownIt): MarkdownIt => md.use(squeezeParagraphs)
});
