import type MarkdownIt from "markdown-it";
import { tabIcons } from "@mirrordown/mdit-tab-icons";

export const activate = (): {
  extendMarkdownIt: (md: MarkdownIt) => MarkdownIt;
} => ({
  extendMarkdownIt: (md: MarkdownIt): MarkdownIt => md.use(tabIcons)
});
