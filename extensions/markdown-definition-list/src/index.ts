import type MarkdownIt from "markdown-it";
import { dl } from "@saeris/mdit-definition-list";

export function extendMarkdownIt(md: MarkdownIt): MarkdownIt {
  return md.use(dl);
}
