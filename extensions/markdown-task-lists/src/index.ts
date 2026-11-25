import type MarkdownIt from "markdown-it";
import { taskLists } from "@mirrordown/mdit-task-lists";

export const activate = (): {
  extendMarkdownIt: (md: MarkdownIt) => MarkdownIt;
} => ({
  extendMarkdownIt: (md: MarkdownIt): MarkdownIt => md.use(taskLists)
});
