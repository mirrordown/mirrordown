---
title: unwrap-images
description: Removes the wrapping paragraph from standalone images so they render as block elements.
---

<style>
  @import url("../../markdown.css");
</style>

## Overview

The `unwrap-images` plugin removes the `<p>` wrapper that Markdown adds around standalone images, allowing images to render as direct block-level elements. Images inside links are also unwrapped.

**Before:**
```html
<p><img src="photo.jpg" alt="A photo"></p>
```

**After:**
```html
<img src="photo.jpg" alt="A photo">
```

## Syntax

Any image that stands alone on a paragraph — with no other text or inline content — is unwrapped:

% Demo
> ![An example image](https://picsum.photos/400/200)
>
> Images mixed with text are **not** unwrapped:
>
> Here is an inline image: ![icon](https://picsum.photos/16/16) within a sentence.
% Code
> ````markdown
> ![An example image](https://picsum.photos/400/200)
>
> Images mixed with text are **not** unwrapped:
>
> Here is an inline image: ![icon](https://picsum.photos/16/16) within a sentence.
> ````

A paragraph of several images, with only spaces or line breaks between them, is unwrapped too. So is a [lightbox](/guide/plugins/lightbox) image, whose trigger button takes the paragraph's place.

The paragraph's own attributes go with it. With the [`attrs`](/guide/plugins/attrs) plugin, a block on the line after the image (`{.wide}`) belongs to the paragraph and is dropped; write it on the image instead (`![…](…){.wide}`).

## Usage

> [!NOTE]
> The remark package ships a rehype plugin, not a remark plugin: add it **after** `remarkRehype` in your pipeline. In every engine, list the lightbox plugin before this one if you use both: listed after it, a lightbox image keeps its paragraph.

% Rehype
> ```sh
> npm install @mirrordown/remd-unwrap-images
> ```
%% Unified
> ```ts
> import { unified } from "unified";
> import remarkParse from "remark-parse";
> import remarkRehype from "remark-rehype";
> import rehypeStringify from "rehype-stringify";
> import { rehypeUnwrapImages } from "@mirrordown/remd-unwrap-images";
>
> const processor = unified()
>   .use(remarkParse)
>   .use(remarkRehype)
>   .use(rehypeUnwrapImages)
>   .use(rehypeStringify);
> ```
%% Astro
> ```ts
> // astro.config.ts
> import { defineConfig } from "astro/config";
> import { rehypeUnwrapImages } from "@mirrordown/remd-unwrap-images";
>
> export default defineConfig({
>   markdown: {
>     rehypePlugins: [rehypeUnwrapImages],
>   },
> });
> ```
% Markdown-It
> ```sh
> npm install @mirrordown/mdit-unwrap-images
> ```
%% Standalone
> ```ts
> import MarkdownIt from "markdown-it";
> import { unwrapImages } from "@mirrordown/mdit-unwrap-images";
>
> const md = new MarkdownIt().use(unwrapImages);
> ```
%% VitePress
> ```ts
> // .vitepress/config.ts
> import { defineConfig } from "vitepress";
> import { unwrapImages } from "@mirrordown/mdit-unwrap-images";
>
> export default defineConfig({
>   markdown: {
>     config: (md) => md.use(unwrapImages),
>   },
> });
> ```
% Sätteri
> ```sh
> npm install @mirrordown/sat-unwrap-images
> ```
%% Standalone
> ```ts
> import { markdownToHtml } from "satteri";
> import { satteriUnwrapImages } from "@mirrordown/sat-unwrap-images";
>
> const { html } = markdownToHtml(source, {
>   hastPlugins: [satteriUnwrapImages()],
> });
> ```
%% Astro
> ```ts
> // astro.config.ts
> import { defineConfig } from "astro/config";
> import { satteri } from "@astrojs/markdown-satteri";
> import { satteriUnwrapImages } from "@mirrordown/sat-unwrap-images";
>
> export default defineConfig({
>   markdown: {
>     processor: satteri({ hastPlugins: [satteriUnwrapImages()] }),
>   },
> });
> ```
