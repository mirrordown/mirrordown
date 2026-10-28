import {
  LIGHTBOX_MARKER,
  isCaptionFigure,
  lightboxDialog,
  lightboxId,
  lightboxTrigger
} from "@mirrordown/core";
import {
  defineHastPlugin,
  type HastVisitorInstance,
  type PluginFactoryContext
} from "satteri";

type AfterHook = NonNullable<HastVisitorInstance["after"]>;
type HastNode = Parameters<AfterHook>[0]["children"][number];
type Element = Extract<HastNode, { type: "element" }>;
type Text = Extract<HastNode, { type: "text" }>;
type Parent = Parameters<AfterHook>[0] | Element;

// The caption of the figure an image is the content of, as a copy of its `<figcaption>`'s children.
const figureCaption = (parent: Parent): Element["children"] | undefined => {
  if (!isCaptionFigure(parent)) return undefined;
  const figcaption = [...parent.children]
    .reverse()
    .find(
      (child): child is Element =>
        child.type === `element` && child.tagName === `figcaption`
    );
  return figcaption ? structuredClone(figcaption.children) : undefined;
};

/**
 * The plugin's definition: only the keys it defines, with a synchronous hook, so `markdownToHtml` returns its result directly.
 */
export interface LightboxPlugin {
  name: string;
  after: (...args: Parameters<AfterHook>) => void;
}

/** An opted-in image, and the text before it that carries the `!`. */
interface Opted {
  image: Element;
  marker: Text;
  src: string;
  authorId: string | undefined;
  caption: Element["children"] | undefined;
}

/** Options for {@link satteriLightbox}. */
export interface LightboxOptions {
  /**
   * Show a captioned image's caption under it in the dialog (an image that is a `~: caption`'s figure content).
   *
   * @default false
   */
  caption?: boolean | undefined;
}

/**
 * Sätteri plugin that opts an image into a JavaScript-free `<dialog>` lightbox with a leading `!!`, e.g. `!![Alt](photo.jpg "Title")`. A marked image becomes a trigger button wrapping the thumbnail, and one modal dialog per image is appended at the end of the document. The dialog id is a stable hash of the src, so repeated references share a dialog; an author `{#id}` overrides it. Images inside a link are skipped. With `caption: true`, an image that is a caption's figure content (`~: caption`, with sat-caption) shows the caption under it in the dialog too. The marker rule, ids and markup are shared with the markdown-it and rehype plugins through `@mirrordown/core`.
 */
export const satteriLightbox =
  (
    options: LightboxOptions = {}
  ): ((ctx: PluginFactoryContext) => LightboxPlugin) =>
  () =>
    defineHastPlugin({
      name: `lightbox`,
      // A src's id depends on every reference to it (an author id on any one wins), so the plugin collects all opted-in images before changing any.
      after(root, ctx) {
        const opted: Opted[] = [];
        const walk = (parent: Parent, inLink: boolean): void => {
          const children = parent.children;
          children.forEach((child, index) => {
            if (child.type !== `element`) return;
            if (child.tagName !== `img`) {
              walk(child, inLink || child.tagName === `a`);
              return;
            }
            const before = children[index - 1];
            if (
              inLink ||
              before?.type !== `text` ||
              !LIGHTBOX_MARKER.test(before.value)
            )
              return;
            const { src, id } = child.properties;
            opted.push({
              image: child,
              marker: before,
              src: typeof src === `string` ? src : ``,
              authorId: typeof id === `string` ? id : undefined,
              caption: options.caption ? figureCaption(parent) : undefined
            });
          });
        };
        walk(root, false);
        if (opted.length === 0) return;

        // One id per unique src: an author `{#id}` wins, else a stable hash.
        const ids = new Map<string, string>();
        for (const { src, authorId } of opted) {
          if (authorId !== undefined) ids.set(src, authorId);
        }
        const dialogs = new Map<
          string,
          { img: Element; caption: Element["children"] | undefined }
        >();
        for (const { image, marker, src, caption } of opted) {
          const id = ids.get(src) ?? lightboxId(src);
          ids.set(src, id);
          // The author id becomes the lightbox id, so the image drops it.
          const { id: _authorId, ...properties } = image.properties;
          const img: Element = {
            type: `element`,
            tagName: `img`,
            properties,
            children: []
          };
          // Strip the `!`, and drop the text if that empties it, so an image left alone in its paragraph still reads as image-only to unwrap-images.
          const rest = marker.value.replace(/!$/, ``);
          if (rest === ``) ctx.removeNode(marker);
          else ctx.replaceNode(marker, { type: `text`, value: rest });
          ctx.replaceNode(image, lightboxTrigger(id, img));
          // Repeated images share one dialog, which shows the first caption any of them has.
          const shown = dialogs.get(id);
          if (!shown) dialogs.set(id, { img: { ...img }, caption });
          else shown.caption ??= caption;
        }
        ctx.appendChild(
          root,
          [...dialogs].map(([id, { img, caption }]) =>
            lightboxDialog(id, img, caption)
          )
        );
      }
    });
