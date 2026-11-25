import type MarkdownIt from "markdown-it";
import { cjkFriendly } from "@mirrordown/mdit-cjk-friendly";

export const activate = (): {
  extendMarkdownIt: (md: MarkdownIt) => MarkdownIt;
} => ({
  extendMarkdownIt: (md: MarkdownIt): MarkdownIt => md.use(cjkFriendly)
});
