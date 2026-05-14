---
title: unwrap-images
description: Removes the wrapping paragraph from standalone images so they render as block elements.
---

<style>
  @import url("../markdown.css");
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

## Usage

> [!NOTE]
> This is a rehype plugin (`rehype-*`), not a remark plugin. Add it **after** `remarkRehype` in your pipeline.

% Rehype
> ```sh
> npm install @saeris/remd-unwrap-images
> ```
%% Unified
> ```ts
> import { unified } from "unified";
> import remarkParse from "remark-parse";
> import remarkRehype from "remark-rehype";
> import rehypeStringify from "rehype-stringify";
> import { rehypeUnwrapImages } from "@saeris/remd-unwrap-images";
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
> import { rehypeUnwrapImages } from "@saeris/remd-unwrap-images";
>
> export default defineConfig({
>   markdown: {
>     rehypePlugins: [rehypeUnwrapImages],
>   },
> });
> ```
%% VitePress
> ```ts
> // .vitepress/config.ts
> import { defineConfig } from "vitepress";
> import { rehypeUnwrapImages } from "@saeris/remd-unwrap-images";
>
> export default defineConfig({
>   markdown: {
>     rehypePlugins: [rehypeUnwrapImages],
>   },
> });
> ```
% Markdown-It
> ```sh
> npm install @saeris/mdit-unwrap-images
> ```
%% Standalone
> ```ts
> import MarkdownIt from "markdown-it";
> import { unwrapImages } from "@saeris/mdit-unwrap-images";
>
> const md = new MarkdownIt().use(unwrapImages);
> ```
%% VitePress
> ```ts
> // .vitepress/config.ts
> import { defineConfig } from "vitepress";
> import { unwrapImages } from "@saeris/mdit-unwrap-images";
>
> export default defineConfig({
>   markdown: {
>     config: (md) => md.use(unwrapImages),
>   },
> });
> ```
