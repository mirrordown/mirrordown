import type Token from "markdown-it/lib/token.mjs";
import type { PluginSimple } from "markdown-it";

// A paragraph is "empty" when its inline token carries no visible content:
// whitespace-only `content` and no rendered children. Mirrors upstream
// mdast-squeeze-paragraphs' whitespace-only text check.
const isEmpty = (inline: Token): boolean =>
  inline.content.trim() === "" &&
  (inline.children ?? []).every(
    (c) => c.type === "softbreak" || c.type === "hardbreak" || c.content === ""
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
