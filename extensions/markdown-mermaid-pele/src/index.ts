import type MarkdownIt from "markdown-it";
import { mermaidPele } from "@mirrordown/mdit-mermaid-pele";

// A diagram that fails to render stays a code block, so one typo doesn't break the whole preview.
export const activate = (): {
  extendMarkdownIt: (md: MarkdownIt) => MarkdownIt;
} => ({
  extendMarkdownIt: (md: MarkdownIt): MarkdownIt =>
    md.use(mermaidPele, {
      errorFallback: (token, _diagram, _error, env) =>
        md.renderer.rules.fence?.([token], 0, md.options, env, md.renderer)
    })
});
