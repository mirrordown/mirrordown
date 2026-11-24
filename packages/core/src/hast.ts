// Logic shared by the rehype and Sätteri hast plugins, so both compute the same result: which paragraphs are empty or hold only images, how headings divide a document into sections, and the lightbox's marker, ids and markup. The plugins apply it with their own tree operations.

import { CAPTION_CLASS } from "./caption.js";

/** The shape of a hast node this module reads and builds. */
export interface HastLike {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: readonly HastLike[];
}

/** A hast element as this module builds it; its properties fit hast's `Properties`. */
export interface HastElementLike<C> {
  type: `element`;
  tagName: string;
  properties: Record<string, string | string[] | false>;
  children: C[];
}

/**
 * The property, set to `false`, that says a `<p>` is not a Markdown paragraph: a plugin built it as part of its own markup (a step's or an alert's title, a lightbox caption), so unwrap-images leaves it whole, as in markdown-it, where it is no paragraph token. A property, because it is what reaches the hast element from an mdast node's `hProperties` in remark and Sätteri alike (neither carries the rest of `data` over); `false`, because hast-util-to-html, Sätteri's output and hast-util-to-estree (MDX) print nothing for a property with that value.
 */
export const MARKDOWN_PARAGRAPH = `markdownParagraph`;

// hast-util-whitespace: only the inter-element whitespace characters.
const WHITESPACE = /^[ \t\n\f\r]*$/;
const isWhitespaceText = (node: HastLike): boolean =>
  node.type === `text` && WHITESPACE.test(node.value ?? ``);

/** A `<p>` with no children, or only whitespace text: squeeze-paragraphs removes it. */
export const isEmptyParagraph = (node: HastLike): boolean =>
  node.tagName === `p` && (node.children ?? []).every(isWhitespaceText);

// Adds the `<img>` elements in `parent` to `images`, each possibly inside a link or a lightbox button, and says whether `parent` holds nothing else but whitespace.
const collectImages = (
  parent: HastLike,
  inLink: boolean,
  images: HastLike[]
): boolean => {
  for (const child of parent.children ?? []) {
    if (isWhitespaceText(child)) continue;
    if (child.type !== `element`) return false;
    if (child.tagName === `img`) {
      images.push(child);
      continue;
    }
    if (
      !inLink &&
      (child.tagName === `a` || child.tagName === `button`) &&
      collectImages(child, true, images)
    ) {
      continue;
    }
    return false;
  }
  return true;
};

// The images of a Markdown paragraph's `<p>` that holds only images and whitespace, in order; none for any other node.
const paragraphImages = (node: HastLike): HastLike[] => {
  const images: HastLike[] = [];
  return node.tagName === `p` &&
    node.properties?.[MARKDOWN_PARAGRAPH] !== false &&
    collectImages(node, false, images)
    ? images
    : [];
};

/**
 * A `<p>` whose content is only images (each possibly inside a link or a lightbox button) and whitespace: unwrap-images replaces it with its children. A `<p>` marked with {@link MARKDOWN_PARAGRAPH} is never one.
 */
export const isImageParagraph = (node: HastLike): boolean =>
  paragraphImages(node).length > 0;

type Property = [name: string, value: unknown];

// The properties hast prints an attribute for: not those whose value is `undefined`, `null` or `false`.
const setProperties = (node: HastLike): Property[] =>
  Object.entries(node.properties ?? {}).filter(
    ([, value]) => value !== undefined && value !== null && value !== false
  );

// Both name the class attribute: hast's own `className` holds a list, and an attributes plugin's `class` (remark's attrs) a space-separated string.
const CLASS = new Set([`class`, `className`]);
const SPACES = /[ \t\n\f\r]+/;
const classNames = (value: unknown): unknown[] =>
  value === undefined
    ? []
    : (Array.isArray(value) ? value : [value]).flatMap((name) =>
        typeof name === `string`
          ? name.split(SPACES).filter((part) => part !== ``)
          : [name]
      );

// The image's properties with the paragraph's added: the image's own win, and the classes are joined, the image's own first, without duplicates, in the form the image's own are written (a list under `className`, a string under `class`). A new property follows the image's own, in the paragraph's order, as markdown-it appends an attribute to a token. Built from entries, so a property named `__proto__` stays a property.
const withParagraphProperties = (
  image: HastLike,
  paragraph: readonly Property[]
): Record<string, unknown> => {
  const entries = setProperties(image);
  for (const [key, value] of paragraph) {
    if (CLASS.has(key)) {
      const own = entries.find(([name]) => CLASS.has(name));
      const names = [
        ...new Set([...classNames(own?.[1]), ...classNames(value)])
      ];
      const entry: Property = own ?? [key, undefined];
      entry[1] = entry[0] === `className` ? names : names.join(` `);
      if (!own) entries.push(entry);
    } else if (!entries.some(([name]) => name === key)) {
      entries.push([key, value]);
    }
  }
  return Object.fromEntries(entries);
};

/**
 * What unwrap-images puts in place of a paragraph, or `undefined` when the paragraph stays. A `<p>` of only images (`isImageParagraph`) is replaced by its children. When it carries an attribute (an id from an attribute block or a block marker, a class, anything), its one image takes them all, also inside a link or a lightbox button, so a link to the paragraph's id still finds the image. A paragraph that carries one and holds several images stays: an id names one element, and a class on a group of images is about the group.
 */
export const unwrapImageParagraph = <C extends HastLike>(
  node: HastLike & { children: readonly C[] }
): C[] | undefined => {
  const children: readonly C[] = node.children;
  const images = paragraphImages(node);
  const [image] = images;
  if (!image) return undefined;
  const carried = setProperties(node);
  if (carried.length === 0) return [...children];
  if (images.length > 1) return undefined;
  const properties = withParagraphProperties(image, carried);
  // New nodes, never a change to the image itself: the lightbox's dialog can share the image's properties, and only the image in the page takes the paragraph's attributes.
  return children.map((child) =>
    child === image
      ? { ...child, properties }
      : child.children?.includes(image)
        ? {
            ...child,
            children: child.children.map((inner) =>
              inner === image ? { ...inner, properties } : inner
            )
          }
        : child
  );
};

/** The rank of an `h1`–`h6` element, or `undefined`. */
export const headingRank = (node: HastLike): number | undefined => {
  if (node.type !== `element`) return undefined;
  const match = /^h([1-6])$/i.exec(node.tagName ?? ``);
  return match ? Number(match[1]) : undefined;
};

/**
 * Wrap heading-delimited runs of `nodes` into `<section data-depth>` elements, nesting deeper headings inside shallower ones. Content before the first heading stays unwrapped.
 */
export const sectionize = <N extends HastLike>(
  nodes: readonly N[],
  section: (depth: number, children: N[]) => N,
  floor = 0
): N[] => {
  // Shallowest heading rank deeper than the floor.
  let minRank = Infinity;
  for (const node of nodes) {
    const rank = headingRank(node);
    if (rank !== undefined && rank > floor && rank < minRank) minRank = rank;
  }
  if (minRank === Infinity) return [...nodes];

  const result: N[] = [];
  let i = 0;
  // Preamble: everything before the first heading of the shallowest rank. It can still hold deeper headings (a run that starts deep and then goes shallower), and every heading gets a section, so it recurses too.
  for (; i < nodes.length; i++) {
    const node = nodes[i];
    if (!node || headingRank(node) === minRank) break;
  }
  result.push(...sectionize(nodes.slice(0, i), section, minRank));
  // Each shallowest heading starts a section that runs until the next peer.
  while (i < nodes.length) {
    const start = i;
    for (i++; i < nodes.length; i++) {
      const node = nodes[i];
      if (!node || headingRank(node) === minRank) break;
    }
    result.push(
      section(minRank, sectionize(nodes.slice(start, i), section, minRank))
    );
  }
  return result;
};

/**
 * The lightbox opt-in: an image directly after a text run that ends in a `!` at a boundary (start of the run or after whitespace), which is what `!![alt](src)` leaves behind.
 */
export const LIGHTBOX_MARKER = /(?:^|\s)!$/;

/**
 * A short, stable lightbox id from an image src (FNV-1a, base36): the same image always gets the same id, so repeated references share one dialog.
 */
export const lightboxId = (src: string): string => {
  let hash = 2166136261;
  for (let i = 0; i < src.length; i += 1) {
    hash ^= src.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `markdown-lightbox-${(hash >>> 0).toString(36)}`;
};

/** The button that replaces an opted-in image and opens its dialog. */
export const lightboxTrigger = <C>(
  id: string,
  image: C
): HastElementLike<C> => ({
  type: `element`,
  tagName: `button`,
  properties: {
    type: `button`,
    className: [`markdown-lightbox-trigger`],
    command: `show-modal`,
    commandfor: id
  },
  children: [image]
});

// The dialog's copy of an image, without a `width` or `height`. Those size the image on the page, whether the image-size plugin read them from the description or an attribute block gave them; the dialog shows the image at full size, and a host that resizes images from those attributes (Astro's image pipeline) would shrink the dialog's image to the thumbnail's.
const fullSize = <C extends HastLike>(image: C): C => {
  if (image.properties === undefined) return image;
  const { width: _width, height: _height, ...properties } = image.properties;
  return { ...image, properties };
};

/** The modal dialog, appended at the document end, showing the image full size, and its caption under it when one is given. The image is shown without the `width` and `height` it has on the page. A caption that is empty or only whitespace text shows nothing, so it gets no `<p>`, as in the markdown-it plugin. */
export const lightboxDialog = <C extends HastLike>(
  id: string,
  image: C,
  caption?: C[]
): HastElementLike<HastElementLike<C>> => ({
  type: `element`,
  tagName: `dialog`,
  properties: { id, className: [`markdown-lightbox`], closedby: `any` },
  children: [
    {
      type: `element`,
      tagName: `button`,
      properties: {
        type: `button`,
        className: [`markdown-lightbox-close`],
        command: `close`,
        commandfor: id,
        ariaLabel: `Close image`
      },
      children: [fullSize(image)]
    },
    ...(caption?.some((node) => !isWhitespaceText(node))
      ? [
          {
            type: `element` as const,
            tagName: `p`,
            properties: {
              className: [`markdown-lightbox-caption`],
              [MARKDOWN_PARAGRAPH]: false as const
            },
            children: caption
          }
        ]
      : [])
  ]
});

/** Whether a node is a caption's figure (`<figure class="markdown-caption">`, as the caption plugins make): an image that is its content shows the figure's caption in its lightbox dialog, with the `caption` option. */
export const isCaptionFigure = (node: HastLike | undefined): boolean => {
  const className = node?.properties?.className;
  return (
    node?.tagName === `figure` &&
    Array.isArray(className) &&
    className.includes(CAPTION_CLASS)
  );
};
