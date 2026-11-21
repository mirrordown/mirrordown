import type { PluginSimple } from "markdown-it";
import type Token from "markdown-it/lib/token.mjs";
import { parseImageSize, type ImageSize } from "@mirrordown/core";

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

// The attributes markdown-it writes on an image itself. The size goes right after them, before any that another plugin added (an attribute block's), where the remark and Sätteri plugins place it.
const OWN = new Set([`src`, `alt`, `title`]);

// The image's attributes with the size in place: its own, then the width and the height the size gives, each with the value an attribute block wrote if it wrote one, then the rest in their order. That is the order the attrs plugin leaves when it runs after this one, setting a value in its place and adding the rest at the end. Run before this one, it leaves a block's `title` where markdown-it's own would be, so that one title is written before the size.
const sized = (
  attrs: ReadonlyArray<[string, string]>,
  size: ImageSize
): Array<[string, string]> => {
  const written = new Map(attrs);
  const slots: Array<[string, string]> = [
    [`width`, written.get(`width`) ?? size.width]
  ];
  if (size.height !== undefined) {
    slots.push([`height`, written.get(`height`) ?? size.height]);
  }
  const taken = new Set(slots.map(([name]) => name));
  return [
    ...attrs.filter(([name]) => OWN.has(name)),
    ...slots,
    ...attrs.filter(([name]) => !OWN.has(name) && !taken.has(name))
  ];
};

/**
 * markdown-it plugin that reads Obsidian's image size from an image's description: `![Engelbart|100x145](e.jpg)` renders `<img src="e.jpg" alt="Engelbart" width="100" height="145">`. The description loses the size, so the alt and every plugin that reads the image afterwards see it without. A `width` or `height` an attribute block wrote on the image wins over the description's. The rule is shared with the remark and Sätteri plugins through `@mirrordown/core`.
 */
export const imageSize: PluginSimple = (md) => {
  // Right before `linkify`, whichever plugin is added first: after the rules that run right after `inline` and change an image's description or make new ones (ruby's verbatim alt, a prompt's preview, an alert's title), and before those that read an image: alert labels right after `linkify`, and the core rules added at the end (lightbox, caption, unwrap-images, which moves an image out of the inline token this rule reads, inline-svg). The attrs plugin's rule sits right before `linkify` too, so the two run in the order they are added (see `sized`).
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
        token.attrs = sized(token.attrs ?? [], size);
      }
    }
  });
};
