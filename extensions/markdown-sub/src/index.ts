import type MarkdownIt from "markdown-it";
import { sub } from "@saeris/mdit-sub";

export const activate = () => ({
  extendMarkdownIt: (md: MarkdownIt) => md.use(sub),
});
