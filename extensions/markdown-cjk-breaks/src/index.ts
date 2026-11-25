import type MarkdownIt from "markdown-it";
import { cjkBreaks } from "@mirrordown/mdit-cjk-breaks";

export const activate = (): {
  extendMarkdownIt: (md: MarkdownIt) => MarkdownIt;
} => ({
  extendMarkdownIt: (md: MarkdownIt): MarkdownIt => md.use(cjkBreaks)
});
