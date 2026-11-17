import type Token from "markdown-it/lib/token.mjs";
import type { PluginSimple } from "markdown-it";

// HTML's inter-element whitespace, the same set as `isEmptyParagraph` in `@mirrordown/core` (which the rehype and Sätteri plugins use), so the engines agree on what is empty. Not `trim()`: that also strips no-break and other Unicode spaces, which are content.
const WHITESPACE = /^[ \t\n\f\r]*$/;

// A paragraph is "empty" when every rendered child is whitespace-only text. A soft break counts while it renders as a newline; with markdown-it's `breaks` option it renders as a `<br>`, which is content, as a hard break always is. The inline token's raw `content` is not consulted: it still holds source another plugin has consumed, such as an attribute block.
const isEmpty = (inline: Token, breaks: boolean): boolean =>
  (inline.children ?? []).every(
    (c) =>
      (c.type === "softbreak" && !breaks) ||
      (c.type === "text" && WHITESPACE.test(c.content))
  );

/** markdown-it plugin that removes empty (whitespace-only) paragraphs. */
export const squeezeParagraphs: PluginSimple = (md) => {
  md.core.ruler.push("squeeze_paragraphs", (state) => {
    // Read per render: the option can be set after the plugin is added.
    const breaks = state.md.options.breaks === true;
    let i = 0;

    while (i < state.tokens.length) {
      const open = state.tokens[i];
      const inline = state.tokens[i + 1];
      const close = state.tokens[i + 2];

      // Matched by tag, not by the `paragraph_open` type: other plugins emit a `<p>` under their own token types (a step's title), and the rehype and Sätteri plugins remove any empty `<p>`.
      if (
        open?.tag !== "p" ||
        open.nesting !== 1 ||
        inline?.type !== "inline" ||
        close?.tag !== "p" ||
        close.nesting !== -1 ||
        !isEmpty(inline, breaks)
      ) {
        i++;
        continue;
      }

      state.tokens.splice(i, 3);
    }
  });
};
