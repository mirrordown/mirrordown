import type MarkdownIt from "markdown-it";
import { ins } from "@saeris/mdit-ins";

export const activate = () => ({
  extendMarkdownIt: (md: MarkdownIt) => md.use(ins),
});
