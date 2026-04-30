import type MarkdownIt from "markdown-it";
import { sup } from "@saeris/mdit-sup";

export const activate = () => ({
  extendMarkdownIt: (md: MarkdownIt) => md.use(sup),
});
