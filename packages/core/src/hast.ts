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
  properties: Record<string, string | string[]>;
  children: C[];
}

// hast-util-whitespace: only the inter-element whitespace characters.
const WHITESPACE = /^[ \t\n\f\r]*$/;
const isWhitespaceText = (node: HastLike): boolean =>
  node.type === `text` && WHITESPACE.test(node.value ?? ``);

/** A `<p>` with no children, or only whitespace text: squeeze-paragraphs removes it. */
export const isEmptyParagraph = (node: HastLike): boolean =>
  node.tagName === `p` && (node.children ?? []).every(isWhitespaceText);

/**
 * A `<p>` whose content is only images (each possibly inside a link or a lightbox button) and whitespace: unwrap-images replaces it with its children.
 */
export const isImageParagraph = (node: HastLike): boolean => {
  // `image`: an image was found; `empty`: nothing but whitespace yet; `other`: anything else.
  const scan = (
    parent: HastLike,
    inLink: boolean
  ): `image` | `empty` | `other` => {
    let result: `image` | `empty` = `empty`;
    for (const child of parent.children ?? []) {
      if (isWhitespaceText(child)) continue;
      if (child.type !== `element`) return `other`;
      if (child.tagName === `img`) {
        result = `image`;
        continue;
      }
      if (!inLink && (child.tagName === `a` || child.tagName === `button`)) {
        const inner = scan(child, true);
        if (inner === `other`) return `other`;
        if (inner === `image`) result = `image`;
        continue;
      }
      return `other`;
    }
    return result;
  };
  return node.tagName === `p` && scan(node, false) === `image`;
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
  // Preamble: everything before the first heading of the shallowest rank.
  for (; i < nodes.length; i++) {
    const node = nodes[i];
    if (!node || headingRank(node) === minRank) break;
    result.push(node);
  }
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

/** The modal dialog, appended at the document end, showing the image full size, and its caption under it when one is given. */
export const lightboxDialog = <C>(
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
      children: [image]
    },
    ...(caption
      ? [
          {
            type: `element` as const,
            tagName: `p`,
            properties: { className: [`markdown-lightbox-caption`] },
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
