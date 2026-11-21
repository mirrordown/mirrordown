import type { PluginSimple } from "markdown-it";
import type Token from "markdown-it/lib/token.mjs";
import { parseImageSize } from "@mirrordown/core";

// A description's text as remark and Sätteri hold an image's alt, which is what the size is read from: its text, escapes, character references and code spans, a line feed for a soft line break and nothing for a hard one. markdown-it's own `renderInlineAsText` drops code spans and the `text_special` tokens an escape or a reference leaves in a description, so `![a\|100](u)` would read as `a100` and `` ![`c`|100](u) `` lose its code.
const plainText = (tokens: readonly Token[]): string => {
  let text = ``;
  for (const token of tokens) {
    if (
      token.type === `text` ||
      token.type === `text_special` ||
      token.type === `code_inline` ||
      token.type === `html_inline`
    ) {
      text += token.content;
    } else if (token.type === `softbreak`) {
      text += `\n`;
    } else if (token.type === `image`) {
      text += plainText(token.children ?? []);
    }
  }
  return text;
};

// The attributes markdown-it writes on an image itself. The size goes right after them, before any that another plugin added (an attribute block's), where the remark and Sätteri plugins place it, so the engines write the same order whichever plugin ran first.
const OWN = new Set([`src`, `alt`, `title`]);

/**
 * markdown-it plugin that reads Obsidian's image size from an image's description: `![Engelbart|100x145](e.jpg)` renders `<img src="e.jpg" alt="Engelbart" width="100" height="145">`. The description loses the size, so the alt and every plugin that reads the image afterwards see it without. A `width` or `height` an attribute block wrote on the image wins over the description's. The rule is shared with the remark and Sätteri plugins through `@mirrordown/core`.
 */
export const imageSize: PluginSimple = (md) => {
  // Right before `linkify`, whichever plugin is added first: after the rules that run right after `inline` and change an image's description or make new ones (ruby's verbatim alt, a prompt's preview, an alert's title), and before those that read an image: alert labels right after `linkify`, and the core rules added at the end (lightbox, caption, unwrap-images, which moves an image out of the inline token this rule reads, inline-svg).
  md.core.ruler.before(`linkify`, `image_size`, (state) => {
    for (const block of state.tokens) {
      if (block.type !== `inline` || !block.children) continue;
      for (const token of block.children) {
        if (token.type !== `image`) continue;
        const size = parseImageSize(plainText(token.children ?? []));
        if (!size) continue;

        // The alt is rendered from the children, so they become the description's text.
        const text = new state.Token(`text`, ``, 0);
        text.content = size.description;
        token.children = [text];
        token.content = size.description;

        const attrs = token.attrs ?? [];
        const added: Array<[string, string]> = [[`width`, size.width]];
        if (size.height !== undefined) added.push([`height`, size.height]);
        const after = attrs.findIndex(([name]) => !OWN.has(name));
        attrs.splice(
          after < 0 ? attrs.length : after,
          0,
          ...added.filter(([name]) => token.attrGet(name) === null)
        );
        token.attrs = attrs;
      }
    }
  });
};
