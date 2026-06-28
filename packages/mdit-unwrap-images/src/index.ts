import type Token from "markdown-it/lib/token.mjs";
import type { PluginSimple } from "markdown-it";

const isImageOnly = (children: Token[]): boolean =>
  children.some((c) => c.type === "image") &&
  children.every((c) => c.type === "image" || c.type === "softbreak");

/** markdown-it plugin that unwraps block-level images out of their paragraph. */
export const unwrapImages: PluginSimple = (md) => {
  md.core.ruler.push("unwrap_images", (state) => {
    let i = 0;

    while (i < state.tokens.length) {
      const open = state.tokens[i];
      const inline = state.tokens[i + 1];
      const close = state.tokens[i + 2];

      if (
        open.type !== "paragraph_open" ||
        // oxlint-disable-next-line typescript/no-unnecessary-condition
        inline?.type !== "inline" ||
        // oxlint-disable-next-line typescript/no-unnecessary-condition
        close?.type !== "paragraph_close"
      ) {
        i++;
        continue;
      }

      const children = inline.children ?? [];

      if (!isImageOnly(children)) {
        i++;
        continue;
      }

      const images = children.filter((c) => c.type !== "softbreak");
      state.tokens.splice(i, 3, ...images);
      i += images.length;
    }
  });
};
