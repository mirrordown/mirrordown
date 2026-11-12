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

// The `<figcaption>` of the figure an image is the content of.
const figureCaption = (parent: Parent): Element | undefined =>
  isCaptionFigure(parent)
    ? [...parent.children]
        .reverse()
        .find(
          (child): child is Element =>
            child.type === `element` && child.tagName === `figcaption`
        )
    : undefined;

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
  caption: Element | undefined;
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
        // id -> the src of the lightbox image that owns it (undefined: another element does).
        const owner = new Map<string, string | undefined>();
        const walk = (parent: Parent, inLink: boolean): void => {
          const children = parent.children;
          children.forEach((child, index) => {
            if (child.type !== `element`) return;
            const { src, id } = child.properties;
            const before = children[index - 1];
            if (
              child.tagName !== `img` ||
              inLink ||
              before?.type !== `text` ||
              !LIGHTBOX_MARKER.test(before.value)
            ) {
              if (typeof id === `string`) owner.set(id, undefined);
              walk(child, inLink || child.tagName === `a`);
              return;
            }
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

        // An author `{#id}` names its image's dialog unless the id is already taken, by another element or by an earlier lightbox image with a different src: a taken id is ignored, so every trigger opens a dialog that shows its own image. Without an id of its own an image shares the first one given to its src, else the stable hash.
        const ids = new Map<string, string>();
        const named = opted.map(({ src, authorId }) => {
          if (authorId === undefined) return undefined;
          if (owner.has(authorId) && owner.get(authorId) !== src)
            return undefined;
          owner.set(authorId, src);
          if (!ids.has(src)) ids.set(src, authorId);
          return authorId;
        });
        const dialogs = new Map<
          string,
          { img: Element; caption: Element | undefined }
        >();
        // What each opted-in image and its marker text become, to make the same changes in a dialog's copy of a caption.
        const triggers = new Map<HastNode, Element["children"][number]>();
        const rests = new Map<HastNode, string>();
        for (const [
          index,
          { image, marker, src, caption }
        ] of opted.entries()) {
          const id = named[index] ?? ids.get(src) ?? lightboxId(src);
          // The author id names the dialog (or is ignored as taken), so the image drops it.
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
          const trigger = lightboxTrigger(id, img);
          ctx.replaceNode(image, trigger);
          triggers.set(image, trigger);
          rests.set(marker, rest);
          // Repeated images share one dialog, which shows the first caption any of them has.
          const shown = dialogs.get(id);
          if (!shown) dialogs.set(id, { img: { ...img }, caption });
          else shown.caption ??= caption;
        }
        // A copy of a caption's children as the document will show them: the replacements above are queued, not applied, so the copy makes them itself, and a lightbox image inside the caption is a trigger in the dialog too.
        const copy = (children: Element["children"]): Element["children"] =>
          children.flatMap((child) => {
            const rest = rests.get(child);
            if (rest !== undefined) {
              return rest === `` ? [] : [{ type: `text`, value: rest }];
            }
            if (child.type !== `element`) return [child];
            return [
              triggers.get(child) ?? {
                ...child,
                children: copy(child.children)
              }
            ];
          });
        ctx.appendChild(
          root,
          [...dialogs].map(([id, { img, caption }]) =>
            lightboxDialog(
              id,
              img,
              caption && structuredClone(copy(caption.children))
            )
          )
        );
      }
    });
