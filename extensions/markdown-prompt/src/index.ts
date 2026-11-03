import type MarkdownIt from "markdown-it";
import { prompt } from "@mirrordown/mdit-prompt";

// The preview opens links but doesn't submit forms, so services are links; in the editor, the prompt is the reader's own text anyway.
export const activate = (): {
  extendMarkdownIt: (md: MarkdownIt) => MarkdownIt;
} => ({
  extendMarkdownIt: (md: MarkdownIt): MarkdownIt =>
    md.use(prompt, { forms: false })
});
