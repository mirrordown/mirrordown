// Token.meta is typed `any` by markdown-it; the casts below read/write our own
// lightboxId/images entries on it.
/* oxlint-disable typescript/no-unsafe-type-assertion */
import type MarkdownIt from "markdown-it";
import type { PluginSimple } from "markdown-it";
import type Token from "markdown-it/lib/token.mjs";

interface ImageMeta {
  lightboxId?: string;
}
interface DialogsMeta {
  images: Token[];
}

// A short, stable id derived from the image src (FNV-1a, base36). The same
// image always gets the same id — so repeated references share one dialog, and
// ids are stable across renders rather than position-dependent like a counter.
const hashId = (src: string): string => {
  let hash = 2166136261;
  for (let i = 0; i < src.length; i += 1) {
    hash ^= src.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `markdown-lightbox-${(hash >>> 0).toString(36)}`;
};

/**
 * markdown-it plugin: opt an image into a fully declarative, JavaScript-free
 * `<dialog>` lightbox with a leading `!!` — e.g. `!![Alt](photo.jpg "Title")`.
 * A marked image becomes a trigger button (`command="show-modal"`) and a
 * matching modal dialog is emitted at the end of the document (a `<dialog>` is
 * flow content and can't live inside the `<p>` that wraps an inline image, so
 * triggers stay inline and dialogs are collected at the document end, linked by
 * `id`). Unmarked images render normally.
 *
 * The dialog id is a stable hash of the image src, so repeated references to the
 * same image share a single dialog. An author `{#id}` (via markdown-it-attrs)
 * overrides it. Images inside a link are skipped (a `<button>` can't nest in an
 * `<a>`).
 */
export const lightbox: PluginSimple = (md) => {
  // Default image renderer (or a token fallback), reused for both the inline
  // trigger thumbnail and the full image inside the dialog.
  const renderImage =
    md.renderer.rules.image ??
    ((
      tokens: Token[],
      idx: number,
      opts: MarkdownIt["options"],
      _env: unknown,
      self: MarkdownIt["renderer"]
    ): string => self.renderToken(tokens, idx, opts));

  md.core.ruler.push("lightbox", (state) => {
    // Collect opted-in images (skipping links) and strip the `!` marker.
    const opted: Array<{
      token: Token;
      src: string;
      authorId: string | undefined;
    }> = [];
    for (const block of state.tokens) {
      if (block.type !== "inline" || !block.children) continue;
      const children = block.children;
      let linkDepth = 0;
      let stripped = false;
      let prev: Token | undefined;
      for (const token of children) {
        // Skip images inside a link: a <button> can't nest in an <a>, and the
        // link is the explicit click intent. The marker stays literal.
        if (token.type === "link_open") linkDepth += 1;
        else if (token.type === "link_close") linkDepth -= 1;
        // Opt in with the `!!image` sigil: an image immediately preceded by a
        // boundary `!` (start of its text run or after whitespace, so a
        // sentence ending in "!" before an image isn't a false positive).
        else if (
          linkDepth === 0 &&
          token.type === "image" &&
          prev?.type === "text" &&
          /(?:^|\s)!$/.test(prev.content)
        ) {
          prev.content = prev.content.replace(/!$/, ""); // strip the marker
          stripped = true;
          opted.push({
            token,
            src: token.attrGet("src") ?? "",
            authorId: token.attrGet("id") ?? undefined
          });
        }
        prev = token;
      }
      // Drop any text token the marker emptied, so an image left alone in its
      // paragraph still reads as image-only to plugins like unwrap-images.
      if (stripped) {
        block.children = children.filter(
          (c) => c.type !== "text" || c.content !== ""
        );
      }
    }
    if (opted.length === 0) return;

    // One id per unique src: an author `{#id}` wins, else a stable hash.
    const srcToId = new Map<string, string>();
    for (const { src, authorId } of opted) {
      if (authorId !== undefined) srcToId.set(src, authorId);
    }
    for (const { src } of opted) {
      if (!srcToId.has(src)) srcToId.set(src, hashId(src));
    }

    // Tag each trigger with its id; collect one dialog image per id.
    const dialogImages = new Map<string, Token>();
    for (const { token, src, authorId } of opted) {
      const id = srcToId.get(src) ?? hashId(src);
      if (authorId !== undefined) {
        // the author id becomes the lightbox id; drop it from the <img>
        token.attrs = token.attrs?.filter(([key]) => key !== "id") ?? null;
      }
      (token.meta as ImageMeta) = { ...token.meta, lightboxId: id };
      if (!dialogImages.has(id)) dialogImages.set(id, token);
    }

    const token = new state.Token("lightbox_dialogs", "", 0);
    token.block = true;
    (token.meta as DialogsMeta) = { images: [...dialogImages.values()] };
    state.tokens.push(token);
  });

  // Each image renders as the inline trigger (a button wrapping the thumbnail).
  md.renderer.rules.image = (tokens, idx, opts, env, self): string => {
    const img = renderImage(tokens, idx, opts, env, self);
    const id = (tokens[idx]?.meta as ImageMeta | null | undefined)?.lightboxId;
    return id === undefined
      ? img
      : `<button type="button" class="markdown-lightbox-trigger" command="show-modal" commandfor="${id}">${img}</button>`;
  };

  // The collected dialogs, emitted as a block at the document end.
  md.renderer.rules["lightbox_dialogs"] = (
    tokens,
    idx,
    opts,
    env,
    self
  ): string =>
    ((tokens[idx]?.meta as DialogsMeta | undefined)?.images ?? [])
      .map((image) => {
        const id = (image.meta as Required<ImageMeta>).lightboxId;
        const img = renderImage([image], 0, opts, env, self);
        return `<dialog id="${id}" class="markdown-lightbox" closedby="any"><button type="button" class="markdown-lightbox-close" command="close" commandfor="${id}" aria-label="Close image">${img}</button></dialog>`;
      })
      .join("\n");
};
