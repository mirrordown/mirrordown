import type MarkdownIt from "markdown-it";
import { plugin } from "@saeris/mdit-<name>";

export function extendMarkdownIt(md: MarkdownIt): MarkdownIt {
  return md.use(plugin);
}
