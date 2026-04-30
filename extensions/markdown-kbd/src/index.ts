import type MarkdownIt from "markdown-it";
import { kbd } from "@saeris/mdit-kbd";

export const activate = () => ({
  extendMarkdownIt: (md: MarkdownIt) => md.use(kbd),
});
