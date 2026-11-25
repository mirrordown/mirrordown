import type MarkdownIt from "markdown-it";
import { blockIds } from "@mirrordown/mdit-block-ids";

// VS Code's preview gives every heading an id of its own. It wraps the `heading_open` renderer after the contributed plugins are applied, sets the id to its slug of the heading's text whatever id the token already has, and then calls the renderer that was there before it. So a block identifier on a heading (`## Title ^intro`) lost its id in the preview and a link to `#^intro` found nothing, while paragraphs, list items and tables kept theirs. The id the plugin gave the heading is remembered once the document is parsed and put back in that earlier renderer, which runs after VS Code has written its slug.
const HEADING_ID = `blockId`;

const keepHeadingIds = (md: MarkdownIt): void => {
  md.core.ruler.push(`block_ids_heading_ids`, (state) => {
    for (const token of state.tokens) {
      if (token.type !== `heading_open`) continue;
      const id = token.attrGet(`id`);
      // Only an id the plugin wrote: a block identifier starts with a caret, which no slug does.
      if (id?.startsWith(`^`)) token.meta = { ...token.meta, [HEADING_ID]: id };
    }
  });

  const previous = md.renderer.rules.heading_open;
  md.renderer.rules.heading_open = (
    tokens,
    index,
    options,
    env,
    self
  ): string => {
    const token = tokens[index];
    const id: unknown = token.meta?.[HEADING_ID];
    if (typeof id === `string`) token.attrSet(`id`, id);
    return previous
      ? previous(tokens, index, options, env, self)
      : self.renderToken(tokens, index, options);
  };
};

export const activate = (): {
  extendMarkdownIt: (md: MarkdownIt) => MarkdownIt;
} => ({
  extendMarkdownIt: (md: MarkdownIt): MarkdownIt => {
    md.use(blockIds);
    keepHeadingIds(md);
    return md;
  }
});
