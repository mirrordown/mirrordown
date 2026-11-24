import type Token from "markdown-it/lib/token.mjs";
import type { PluginSimple } from "markdown-it";

// HTML's inter-element whitespace, as `isImageParagraph` in `@mirrordown/core` counts it for the rehype and Sätteri plugins.
const WHITESPACE = /^[ \t\n\f\r]*$/;
const SPACES = /[ \t\n\f\r]+/;

// The token form of `isImageParagraph`: the images of a paragraph that holds only images, each possibly inside a link, and whitespace between them; none for any other. Keep the two in step, or the engines unwrap different paragraphs.
const imagesOf = (children: Token[]): Token[] => {
  const images: Token[] = [];
  let inLink = false;
  for (const child of children) {
    if (child.type === "image") images.push(child);
    else if (child.type === "link_open" && !inLink) inLink = true;
    else if (child.type === "link_close" && inLink) inLink = false;
    else if (child.type === "softbreak") continue;
    else if (child.type === "text" && WHITESPACE.test(child.content)) continue;
    else return [];
  }
  return images;
};

const classes = (value: string | undefined): string[] =>
  value?.split(SPACES).filter((name) => name !== "") ?? [];

// The token form of the attribute rule in `unwrapImageParagraph` (`@mirrordown/core`): the image's own attributes win, the classes are joined, the image's own first, without duplicates, and a new attribute follows the image's own in the paragraph's order. Keep the two in step.
const withParagraphAttrs = (
  image: Token,
  paragraph: ReadonlyArray<[string, string]>
): Array<[string, string]> => {
  const attrs = (image.attrs ?? []).map(([name, value]): [string, string] => [
    name,
    value
  ]);
  for (const [name, value] of paragraph) {
    const own = attrs.find(([key]) => key === name);
    if (name === "class") {
      const joined = [
        ...new Set([...classes(own?.[1]), ...classes(value)])
      ].join(" ");
      if (own) own[1] = joined;
      else attrs.push([name, joined]);
    } else if (!own) attrs.push([name, value]);
  }
  return attrs;
};

/** markdown-it plugin that unwraps block-level images out of their paragraph, giving the paragraph's attributes to its one image. */
export const unwrapImages: PluginSimple = (md) => {
  md.core.ruler.push("unwrap_images", (state) => {
    // The tokens are written to a new stream in one pass: putting each paragraph's children in its place in the old one moved every later token once per paragraph, which made a document of many image paragraphs quadratic.
    const { tokens } = state;
    const kept: Token[] = [];
    let i = 0;

    while (i < tokens.length) {
      const open = tokens[i];
      const inline = tokens[i + 1];
      const close = tokens[i + 2];

      if (
        open.type !== "paragraph_open" ||
        // oxlint-disable-next-line typescript/no-unnecessary-condition
        inline?.type !== "inline" ||
        // oxlint-disable-next-line typescript/no-unnecessary-condition
        close?.type !== "paragraph_close"
      ) {
        kept.push(open);
        i++;
        continue;
      }

      const children = inline.children ?? [];
      const images = imagesOf(children);
      const carried = open.attrs ?? [];

      // A paragraph that carries an attribute and holds several images stays: an id names one element, and a class on a group of images is about the group.
      if (images.length === 0 || (carried.length > 0 && images.length > 1)) {
        kept.push(open, inline, close);
        i += 3;
        continue;
      }

      // The paragraph's attributes go on its one image, so a link to the paragraph's id still finds it. On a new token: the lightbox renders its dialog from the image token it was given, and only the image in the page takes the paragraph's attributes.
      if (carried.length > 0) {
        const [image] = images;
        const moved = new state.Token(image.type, image.tag, image.nesting);
        Object.assign(moved, image, {
          attrs: withParagraphAttrs(image, carried)
        });
        children[children.indexOf(image)] = moved;
      }

      // Everything the paragraph held takes its place, the whitespace between images included: remark and Sätteri keep it, and two inline images with a gap are not two that touch.
      for (const child of children) kept.push(child);
      i += 3;
    }

    state.tokens = kept;
  });
};
