import type MarkdownIt from "markdown-it";
import { tabs } from "@saeris/mdit-tabs";

export const activate = (): {
  extendMarkdownIt: (md: MarkdownIt) => MarkdownIt;
} => ({
  extendMarkdownIt: (md: MarkdownIt): MarkdownIt => md.use(tabs)
});
