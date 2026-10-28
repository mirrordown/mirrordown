import {
  LIGHTBOX_MARKER,
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
}

/**
 * Sätteri plugin that opts an image into a JavaScript-free `<dialog>` lightbox with a leading `!!`, e.g. `!![Alt](photo.jpg "Title")`. A marked image becomes a trigger button wrapping the thumbnail, and one modal dialog per image is appended at the end of the document. The dialog id is a stable hash of the src, so repeated references share a dialog; an author `{#id}` overrides it. Images inside a link are skipped. The marker rule, ids and markup are shared with the markdown-it and rehype plugins through `@mirrordown/core`.
 */
export const satteriLightbox =
  (): ((ctx: PluginFactoryContext) => LightboxPlugin) => () =>
    defineHastPlugin({
      name: `lightbox`,
      // A src's id depends on every reference to it (an author id on any one wins), so the plugin collects all opted-in images before changing any.
      after(root, ctx) {
        const opted: Opted[] = [];
        const walk = (children: readonly HastNode[], inLink: boolean): void => {
          children.forEach((child, index) => {
            if (child.type !== `element`) return;
            if (child.tagName !== `img`) {
              walk(child.children, inLink || child.tagName === `a`);
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
              authorId: typeof id === `string` ? id : undefined
            });
          });
        };
        walk(root.children, false);
        if (opted.length === 0) return;

        // One id per unique src: an author `{#id}` wins, else a stable hash.
        const ids = new Map<string, string>();
        for (const { src, authorId } of opted) {
          if (authorId !== undefined) ids.set(src, authorId);
        }
        const dialogs = new Map<string, Element>();
        for (const { image, marker, src } of opted) {
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
          if (!dialogs.has(id)) dialogs.set(id, lightboxDialog(id, { ...img }));
        }
        ctx.appendChild(root, [...dialogs.values()]);
      }
    });
