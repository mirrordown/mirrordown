import type Token from "markdown-it/lib/token.mjs";
import type { PluginSimple } from "markdown-it";

// A paragraph is "empty" when every rendered child is whitespace-only text (a soft break renders as a newline), as in rehype-squeeze-paragraphs. The inline token's raw `content` is not consulted: it still holds source another plugin has consumed, such as an attribute block.
const isEmpty = (inline: Token): boolean =>
  (inline.children ?? []).every(
    (c) =>
      c.type === "softbreak" || (c.type === "text" && c.content.trim() === "")
  );

/** markdown-it plugin that removes empty (whitespace-only) paragraphs. */
export const squeezeParagraphs: PluginSimple = (md) => {
  md.core.ruler.push("squeeze_paragraphs", (state) => {
    let i = 0;

    while (i < state.tokens.length) {
      const open = state.tokens[i];
      const inline = state.tokens[i + 1];
      const close = state.tokens[i + 2];

      if (
        open?.type !== "paragraph_open" ||
        inline?.type !== "inline" ||
        close?.type !== "paragraph_close" ||
        !isEmpty(inline)
      ) {
        i++;
        continue;
      }

      state.tokens.splice(i, 3);
    }
  });
};
