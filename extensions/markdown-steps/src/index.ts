import type MarkdownIt from "markdown-it";
import { steps } from "@saeris/mdit-steps";

export const activate = () => ({
  extendMarkdownIt: (md: MarkdownIt) => md.use(steps),
});
