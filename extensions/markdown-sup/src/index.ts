import type MarkdownIt from "markdown-it";
import { sup } from "@saeris/mdit-sup";

export const activate = (): {
  extendMarkdownIt: (md: MarkdownIt) => MarkdownIt;
} => ({
  extendMarkdownIt: (md: MarkdownIt): MarkdownIt => md.use(sup)
});
