import type MarkdownIt from "markdown-it";
import { abbr } from "@saeris/mdit-abbr";

export const activate = () => ({
  extendMarkdownIt: (md: MarkdownIt) => md.use(abbr),
});
