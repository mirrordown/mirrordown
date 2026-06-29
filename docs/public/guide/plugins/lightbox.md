---
title: lightbox
description: Opts an image into a JavaScript-free, click-to-zoom <dialog> lightbox with a leading !!.
---

<style>
  @import url("../../markdown.css");
</style>

## Overview

The `lightbox` plugin opts an image into a click-to-zoom lightbox with a leading `!!`. The marked image becomes a trigger button that opens the full-size image in a modal `<dialog>`, dimming and blurring the page behind it. Unmarked images (`![…]`) render normally.

The entire interaction — open, close, backdrop dismiss, `Esc`, focus trapping, and the zoom/fade animation — is built from modern declarative HTML and CSS only: [`<dialog>`](https://developer.mozilla.org/docs/Web/HTML/Element/dialog), the [Invoker Commands API](https://developer.mozilla.org/docs/Web/API/Invoker_Commands_API) (`command`/`commandfor`), `closedby="any"`, and [`@starting-style`](https://developer.mozilla.org/docs/Web/CSS/@starting-style). **No JavaScript runs**, so it works in environments that disable scripts, such as the VSCode Markdown preview.

The trigger stays inline; the matching `<dialog>` is emitted at the end of the document (a `<dialog>` is flow content and can't live inside the `<p>` that wraps an inline image), linked by `id`:

```html
<button type="button" class="markdown-lightbox-trigger" command="show-modal" commandfor="markdown-lightbox-1h8yfti">
  <img src="photo.jpg" alt="…" />
</button>

<!-- …emitted at the end of the document… -->
<dialog id="markdown-lightbox-1h8yfti" class="markdown-lightbox" closedby="any">
  <button type="button" class="markdown-lightbox-close" command="close" commandfor="markdown-lightbox-1h8yfti" aria-label="Close image">
    <img src="photo.jpg" alt="…" />
  </button>
</dialog>
```

## Syntax

Add a second `!` in front of any image. Click a thumbnail below to zoom; click it again, click the backdrop, or press `Esc` to close.

% Demo
> !![Wild rice growing in a marsh](./assets/wild-rice.jpg "Wild rice")
> !![A young sapling](./assets/sapling.jpg "Sapling")
>
% Code
> ````markdown
> !![Wild rice growing in a marsh](./assets/wild-rice.jpg "Wild rice")
> !![A young sapling](./assets/sapling.jpg "Sapling")
> ````

In renderers without the plugin, the extra `!` renders as plain text and the image still shows.

### Repeated images share one dialog

The dialog `id` is a stable hash of the image `src`, so referencing the same image more than once produces a **single** dialog that every trigger opens — not a duplicate per reference.

% Demo
> Here is a dock: !![A dock on a still lake](./assets/dock.jpg "Dock"). And here is the very same dock again: !![The same dock](./assets/dock.jpg "Dock").
>
% Code
> ````markdown
> Here is a dock: !![A dock on a still lake](./assets/dock.jpg "Dock").
> And here is the very same dock again: !![The same dock](./assets/dock.jpg "Dock").
> ````

### Naming a lightbox

By default the `id` is hashed from the `src`. With the [`attrs`](/guide/plugins/attrs) plugin you can name it explicitly with `{#id}` — handy for stable, human-readable ids. The id moves onto the dialog, so it isn't duplicated on the image.

% Demo
> !![Mount Fuji at dawn](./assets/fuji.jpg "Mount Fuji"){#fuji}
>
% Code
> ````markdown
> !![Mount Fuji at dawn](./assets/fuji.jpg "Mount Fuji"){#fuji}
> ````

### Images inside links

An image wrapped in a link is left alone: a `<button>` can't nest in an `<a>`, and the link is the explicit click intent — so the link wins and the `!` stays literal.

% Demo
> [!![Swan boats on the lake](./assets/swan-boats.jpg "Swan boats")](https://example.com)
>
% Code
> ````markdown
> [!![Swan boats on the lake](./assets/swan-boats.jpg "Swan boats")](https://example.com)
> ````

## Customization

The stylesheet keeps its rules in `@layer markdown-lightbox`, so any unlayered CSS you write overrides them without `!important`. The common knobs are exposed as custom properties — set them on `:root` or any ancestor:

| Property                       | Default            | Description                      |
| ------------------------------ | ------------------ | -------------------------------- |
| `--markdown-lightbox-backdrop` | `rgb(0 0 0 / 72%)` | Backdrop color behind the image. |
| `--markdown-lightbox-blur`     | `3px`              | Backdrop blur radius.            |
| `--markdown-lightbox-radius`   | `0.375rem`         | Image corner radius.             |
| `--markdown-lightbox-duration` | `0.25s`            | Open/close transition duration.  |

```css
:root {
  --markdown-lightbox-backdrop: rgb(0 0 0 / 85%);
  --markdown-lightbox-blur: 6px;
  --markdown-lightbox-radius: 0.5rem;
  --markdown-lightbox-duration: 0.2s;
}
```

## Browser support

Requires `command`/`commandfor`, `<dialog closedby>`, and `@starting-style` (Chromium 135+ and equivalent). Where unsupported, images degrade to a plain, non-zooming thumbnail.

## Usage

% Remark
> The remark package ships `rehypeLightbox`, a rehype plugin — it runs on the hast tree, so register it after `remark-rehype`. Run it before [`unwrap-images`](/guide/plugins/unwrap-images) if you use both.
>
> ```sh
> npm install @mirrordown/remd-lightbox
> ```
%% Unified
> ```ts
> import { unified } from "unified";
> import remarkParse from "remark-parse";
> import remarkRehype from "remark-rehype";
> import rehypeStringify from "rehype-stringify";
> import { rehypeLightbox } from "@mirrordown/remd-lightbox";
> import "@mirrordown/remd-lightbox/lightbox.css";
>
> const processor = unified()
>   .use(remarkParse)
>   .use(remarkRehype)
>   .use(rehypeLightbox)
>   .use(rehypeStringify);
> ```
%% Astro
> ```ts
> // astro.config.ts
> import { defineConfig } from "astro/config";
> import { rehypeLightbox } from "@mirrordown/remd-lightbox";
> import "@mirrordown/remd-lightbox/lightbox.css";
>
> export default defineConfig({
>   markdown: {
>     rehypePlugins: [rehypeLightbox],
>   },
> });
> ```
% Markdown-It
> ```sh
> npm install @mirrordown/mdit-lightbox
> ```
%% Standalone
> ```ts
> import MarkdownIt from "markdown-it";
> import { lightbox } from "@mirrordown/mdit-lightbox";
> import "@mirrordown/mdit-lightbox/styles";
>
> const md = new MarkdownIt().use(lightbox);
> ```
%% VitePress
> ```ts
> // .vitepress/config.ts
> import { defineConfig } from "vitepress";
> import { lightbox } from "@mirrordown/mdit-lightbox";
> import "@mirrordown/mdit-lightbox/styles";
>
> export default defineConfig({
>   markdown: {
>     config: (md) => md.use(lightbox),
>   },
> });
> ```
