---
title: autolink-headings
description: Adds links from headings back to themselves so they can be shared.
---

<style>
  @import url("../../markdown.css");
</style>

## Overview

The `autolink-headings` plugin adds a self-referential link to every heading that has an `id`, turning each heading into a shareable anchor. Pair it with [`slug`](/guide/plugins/slug) (or [`attrs`](/guide/plugins/attrs)) so the headings have ids to link to.

**Before:**
```html
<h2 id="getting-started">Getting Started</h2>
```

**After:**
```html
<h2 id="getting-started"><a class="anchor" aria-hidden="true" tabindex="-1" href="#getting-started"></a>Getting Started</h2>
```

By default the link is **empty** and carries `class="anchor"`. The shipped stylesheet draws a `#` marker via a CSS `::before` pseudo-element that fades in on hover — so no extra element is emitted, and there is no JavaScript involved.

## Syntax

There is no special syntax — just write headings. Hover one to reveal its link:

% Demo
> ### Hover Over This Heading
>
> ### And This One Too
% Code
> ````markdown
> ### Hover Over This Heading
>
> ### And This One Too
> ````

## Usage

> [!NOTE]
> This is a rehype plugin (`rehype-*`), not a remark plugin. Add it **after** `remarkRehype`, and **after** [`slug`](/guide/plugins/slug), so the headings already have ids. Import the stylesheet to get the default `#` marker.

% Rehype
> ```sh
> npm install @mirrordown/remd-autolink-headings
> ```
%% Unified
> ```ts
> import { unified } from "unified";
> import remarkParse from "remark-parse";
> import remarkRehype from "remark-rehype";
> import rehypeStringify from "rehype-stringify";
> import { rehypeSlug } from "@mirrordown/remd-slug";
> import { rehypeAutolinkHeadings } from "@mirrordown/remd-autolink-headings";
> import "@mirrordown/remd-autolink-headings/autolink-headings.css";
>
> const processor = unified()
>   .use(remarkParse)
>   .use(remarkRehype)
>   .use(rehypeSlug)
>   .use(rehypeAutolinkHeadings)
>   .use(rehypeStringify);
> ```
%% Astro
> ```ts
> // astro.config.ts
> import { defineConfig } from "astro/config";
> import { rehypeSlug } from "@mirrordown/remd-slug";
> import { rehypeAutolinkHeadings } from "@mirrordown/remd-autolink-headings";
>
> export default defineConfig({
>   markdown: {
>     rehypePlugins: [rehypeSlug, rehypeAutolinkHeadings],
>   },
> });
> ```
%% VitePress
> ```ts
> // .vitepress/config.ts
> import { defineConfig } from "vitepress";
> import { rehypeSlug } from "@mirrordown/remd-slug";
> import { rehypeAutolinkHeadings } from "@mirrordown/remd-autolink-headings";
>
> export default defineConfig({
>   markdown: {
>     rehypePlugins: [rehypeSlug, rehypeAutolinkHeadings],
>   },
> });
> ```
% Markdown-It
> ```sh
> npm install @mirrordown/mdit-autolink-headings
> ```
%% Standalone
> ```ts
> import MarkdownIt from "markdown-it";
> import { slug } from "@mirrordown/mdit-slug";
> import { autolinkHeadings } from "@mirrordown/mdit-autolink-headings";
> import "@mirrordown/mdit-autolink-headings/styles";
>
> const md = new MarkdownIt().use(slug).use(autolinkHeadings);
> ```
%% VitePress
> ```ts
> // .vitepress/config.ts
> import { defineConfig } from "vitepress";
> import { slug } from "@mirrordown/mdit-slug";
> import { autolinkHeadings } from "@mirrordown/mdit-autolink-headings";
>
> export default defineConfig({
>   markdown: {
>     config: (md) => md.use(slug).use(autolinkHeadings),
>   },
> });
> ```

## Options

| Option      | Type                                            | Default     | Description                                              |
| ----------- | ----------------------------------------------- | ----------- | ------------------------------------------------------- |
| `behavior`  | `"prepend" \| "append" \| "wrap" \| "before" \| "after"` | `"prepend"` | Where the link is placed relative to the heading.       |

`behavior` controls the structure:

- **`prepend`** / **`append`** — the link is the first / last child of the heading (`aria-hidden`, not focusable).
- **`wrap`** — the link wraps the heading's content.
- **`before`** / **`after`** — the link is a sibling placed before / after the heading.

```ts
rehypeAutolinkHeadings({ behavior: "append" });
```

The markdown-it plugin accepts `behavior` plus a `class` option (default `"anchor"`) to rename the link's class.

> [!NOTE]
> The rehype plugin additionally accepts `content`, `properties`, `headingProperties`, `group`, and `test` options for full control over the emitted link — see [`rehype-autolink-headings`](https://github.com/rehypejs/rehype-autolink-headings) for their semantics. These take **hast** nodes and callbacks, which have no markdown-it equivalent, so they are available only on the rehype (`remd-*`) side.
