import type MarkdownIt from "markdown-it";
import { sectionize } from "@mirrordown/mdit-sectionize";

export const activate = (): {
  extendMarkdownIt: (md: MarkdownIt) => MarkdownIt;
} => ({
  extendMarkdownIt: (md: MarkdownIt): MarkdownIt => md.use(sectionize)
});
