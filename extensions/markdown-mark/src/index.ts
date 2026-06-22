import type MarkdownIt from "markdown-it";
import { mark } from "@saeris/mdit-mark";

export const activate = (): {
  extendMarkdownIt: (md: MarkdownIt) => MarkdownIt;
} => ({
  extendMarkdownIt: (md: MarkdownIt): MarkdownIt => md.use(mark)
});
