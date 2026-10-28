import { visit } from "unist-util-visit";
import {
  LIGHTBOX_MARKER,
  isCaptionFigure,
  lightboxDialog,
  lightboxId,
  lightboxTrigger
} from "@mirrordown/core";
import type { Root, Element, ElementContent, RootContent } from "hast";
import type { Plugin } from "unified";

/** Options for {@link rehypeLightbox}. */
export interface LightboxOptions {
  /**
   * Show a captioned image's caption under it in the dialog (an image that is a `~: caption`'s figure content).
   *
   * @default false
   */
  caption?: boolean | undefined;
}

// The caption of the figure an image is the content of, as a copy of its `<figcaption>`'s children.
const figureCaption = (
  parent: Root | Element
): ElementContent[] | undefined => {
  if (!isCaptionFigure(parent)) return undefined;
  const figcaption = [...parent.children]
    .reverse()
    .find(
      (child): child is Element =>
        child.type === "element" && child.tagName === "figcaption"
    );
  return figcaption ? structuredClone(figcaption.children) : undefined;
};

/**
 * rehype plugin: opt an image into a fully declarative, JavaScript-free
 * `<dialog>` lightbox with a leading `!!` — e.g. `!![Alt](photo.jpg "Title")`.
 * A marked image becomes a trigger button (`command="show-modal"`) wrapping the
 * thumbnail, and a matching modal dialog is appended at the end of the document
 * (a `<dialog>` is flow content and can't live inside the `<p>` that wraps an
 * inline image). Unmarked images render normally.
 *
 * With `caption: true`, an image that is a caption's figure content (`~: caption`, with remd-caption) shows the caption under it in the dialog too.
 *
 * The dialog id is a stable hash of the image src, so repeated references to the same image share a single dialog; an author `{#id}` (via remark-attrs) overrides it. Images inside a link are skipped (a `<button>` can't nest in an `<a>`). The marker rule, the id and the markup are shared with the Sätteri plugin through `@mirrordown/core`.
 */
export const rehypeLightbox: Plugin<[LightboxOptions?], Root> =
  (options = {}) =>
  (tree) => {
    // Images anywhere inside a link are skipped: a <button> can't nest in an <a>,
    // and the link is the explicit click intent. The marker stays literal.
    const inLink = new Set<Element>();
    visit(tree, "element", (node) => {
      if (node.tagName !== "a") return;
      visit(node, "element", (el) => {
        if (el.tagName === "img") inLink.add(el);
      });
    });

    // Collect opted-in images and strip the `!` marker from the preceding text.
    const opted: Array<{
      parent: Root | Element;
      index: number;
      img: Element;
      src: string;
      authorId: string | undefined;
      caption: ElementContent[] | undefined;
    }> = [];
    const emptiedParents = new Set<Root | Element>();
    visit(tree, "element", (node, index, parent) => {
      if (
        node.tagName !== "img" ||
        inLink.has(node) ||
        parent === undefined ||
        index === undefined ||
        index === 0
      ) {
        return;
      }
      const prev = parent.children[index - 1];
      if (prev?.type !== "text" || !LIGHTBOX_MARKER.test(prev.value)) return;
      prev.value = prev.value.replace(/!$/, "");
      if (prev.value === "") emptiedParents.add(parent);
      opted.push({
        parent,
        index,
        img: node,
        src: typeof node.properties.src === "string" ? node.properties.src : "",
        authorId:
          typeof node.properties.id === "string"
            ? node.properties.id
            : undefined,
        caption: options.caption ? figureCaption(parent) : undefined
      });
    });
    if (opted.length === 0) return;

    // One id per unique src: an author `{#id}` wins, else a stable hash.
    const srcToId = new Map<string, string>();
    for (const { src, authorId } of opted) {
      if (authorId !== undefined) srcToId.set(src, authorId);
    }
    for (const { src } of opted) {
      if (!srcToId.has(src)) srcToId.set(src, lightboxId(src));
    }

    // Replace each trigger with a button; collect one dialog image per id.
    const dialogImages = new Map<
      string,
      { img: Element; caption: ElementContent[] | undefined }
    >();
    for (const { parent, index, img, src, authorId, caption } of opted) {
      const id = srcToId.get(src) ?? lightboxId(src);
      if (authorId !== undefined) {
        // the author id becomes the lightbox id; drop it from the <img>
        delete img.properties.id;
      }
      parent.children[index] = lightboxTrigger(id, img);
      // Repeated images share one dialog, which shows the first caption any of them has.
      const shown = dialogImages.get(id);
      if (!shown) dialogImages.set(id, { img: structuredClone(img), caption });
      else shown.caption ??= caption;
    }

    // Drop any text node the marker emptied, so an image left alone in its
    // paragraph still reads as image-only to plugins like unwrap-images.
    for (const node of emptiedParents) {
      node.children = node.children.filter(
        (c) => !(c.type === "text" && c.value === "")
      );
    }

    // Append one dialog per id at the document end.
    const dialogs: RootContent[] = [];
    for (const [id, { img, caption }] of dialogImages) {
      dialogs.push(lightboxDialog<ElementContent>(id, img, caption));
    }
    tree.children.push(...dialogs);
  };
