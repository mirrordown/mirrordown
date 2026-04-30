import type MarkdownIt from "markdown-it";
import { inlineSvg } from "@saeris/mdit-inline-svg";

export const activate = () => ({
  extendMarkdownIt: (md: MarkdownIt) => md.use(inlineSvg),
});
