import type Token from "markdown-it/lib/token.mjs";
import type { PluginSimple } from "markdown-it";

// HTML's inter-element whitespace, as `isImageParagraph` in `@mirrordown/core` counts it for the rehype and Sätteri plugins.
const WHITESPACE = /^[ \t\n\f\r]*$/;

// The token form of `isImageParagraph`: only images, each possibly inside a link, and whitespace between them. Keep the two in step, or the engines unwrap different paragraphs.
const isImageOnly = (children: Token[]): boolean => {
  let image = false;
  let inLink = false;
  for (const child of children) {
    if (child.type === "image") image = true;
    else if (child.type === "link_open" && !inLink) inLink = true;
    else if (child.type === "link_close" && inLink) inLink = false;
    else if (child.type === "softbreak") continue;
    else if (child.type === "text" && WHITESPACE.test(child.content)) continue;
    else return false;
  }
  return image;
};

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

      // Everything the paragraph held takes its place, the whitespace between images included: remark and Sätteri keep it, and two inline images with a gap are not two that touch.
      state.tokens.splice(i, 3, ...children);
      i += children.length;
    }
  });
};
