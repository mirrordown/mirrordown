import type MarkdownIt from "markdown-it";
import { sub } from "@saeris/mdit-sub";

export const activate = (): {
  extendMarkdownIt: (md: MarkdownIt) => MarkdownIt;
} => ({
  extendMarkdownIt: (md: MarkdownIt): MarkdownIt => md.use(sub)
});
