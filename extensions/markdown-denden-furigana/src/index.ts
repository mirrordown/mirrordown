import type MarkdownIt from "markdown-it";
import { ruby } from "@saeris/mdit-ruby";

export const activate = () => ({
  extendMarkdownIt: (md: MarkdownIt) => md.use(ruby),
});
