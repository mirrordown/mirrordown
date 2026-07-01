---
title: slug
description: Adds GitHub-style id slugs to headings so they can be linked to.
---

<style>
  @import url("../../markdown.css");
</style>

## Overview

The `slug` plugin adds an `id` to every heading (`<h1>`–`<h6>`), derived from the heading's text content using [`github-slugger`](https://github.com/Flet/github-slugger) — the same algorithm GitHub uses. This gives every heading a stable, predictable anchor target.

**Before:**
```html
<h2>Getting Started</h2>
```

**After:**
```html
<h2 id="getting-started">Getting Started</h2>
```

Headings that already have an `id` (for example from [`attrs`](/guide/plugins/attrs) via `{#custom}`) are left untouched, and repeated heading text is de-duplicated with a numeric suffix (`overview`, `overview-1`, `overview-2`, …).

## Syntax

There is no special syntax — just write headings. Each one receives an `id` based on its text:

% Demo
> ### A Simple Heading
>
> ### Café & Crème
>
> ### A Simple Heading
% Code
> ````markdown
> ### A Simple Heading
>
> ### Café & Crème
>
> ### A Simple Heading
> ````

The three headings above become `id="a-simple-heading"`, `id="café--crème"`, and `id="a-simple-heading-1"` respectively.

## Usage

> [!NOTE]
> This is a rehype plugin (`rehype-*`), not a remark plugin. Add it **after** `remarkRehype` in your pipeline. To honor explicit `{#custom}` ids, place it after [`attrs`](/guide/plugins/attrs).

% Rehype
> ```sh
> npm install @mirrordown/remd-slug
> ```
%% Unified
> ```ts
> import { unified } from "unified";
> import remarkParse from "remark-parse";
> import remarkRehype from "remark-rehype";
> import rehypeStringify from "rehype-stringify";
> import { rehypeSlug } from "@mirrordown/remd-slug";
>
> const processor = unified()
>   .use(remarkParse)
>   .use(remarkRehype)
>   .use(rehypeSlug)
>   .use(rehypeStringify);
> ```
%% Astro
> ```ts
> // astro.config.ts
> import { defineConfig } from "astro/config";
> import { rehypeSlug } from "@mirrordown/remd-slug";
>
> export default defineConfig({
>   markdown: {
>     rehypePlugins: [rehypeSlug],
>   },
> });
> ```
%% VitePress
> ```ts
> // .vitepress/config.ts
> import { defineConfig } from "vitepress";
> import { rehypeSlug } from "@mirrordown/remd-slug";
>
> export default defineConfig({
>   markdown: {
>     rehypePlugins: [rehypeSlug],
>   },
> });
> ```
% Markdown-It
> ```sh
> npm install @mirrordown/mdit-slug
> ```
%% Standalone
> ```ts
> import MarkdownIt from "markdown-it";
> import { slug } from "@mirrordown/mdit-slug";
>
> const md = new MarkdownIt().use(slug);
> ```
%% VitePress
> ```ts
> // .vitepress/config.ts
> import { defineConfig } from "vitepress";
> import { slug } from "@mirrordown/mdit-slug";
>
> export default defineConfig({
>   markdown: {
>     config: (md) => md.use(slug),
>   },
> });
> ```

## Options

| Option   | Type     | Default | Description                              |
| -------- | -------- | ------- | ---------------------------------------- |
| `prefix` | `string` | `""`    | Prepended to every generated `id` value. |

```ts
rehypeSlug({ prefix: "user-content-" });
// <h2 id="user-content-getting-started">Getting Started</h2>
```

The markdown-it plugin accepts the same `prefix` option: `md.use(slug, { prefix: "user-content-" })`.
