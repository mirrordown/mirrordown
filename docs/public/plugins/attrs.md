---
title: attrs
description: Adds attribute syntax to attach HTML attributes to headings, blocks, inline elements, and more.
---

<style>
  @import url("../markdown.css");
</style>

## Overview

The `attrs` plugin lets you attach HTML attributes (classes, IDs, data attributes, etc.) to almost any Markdown element using `{...}` syntax. It supports headings, paragraphs, code fences, inline elements, lists, tables, and horizontal rules.

```html
<h2 id="my-section" class="highlight">My Section</h2>
```

## Syntax

Attributes are written in curly braces using CSS-like shorthand:

- `#id` → sets `id`
- `.class` → adds a class
- `key=value` → sets any attribute

### Headings

## My Section {#my-section .highlight}

### Code fences

```ts {.language-typescript data-filename="example.ts"}
const x = 1;
```

### Paragraphs

A paragraph with a custom class.
{.note}

### Inline elements

This is **important**{.warning} text.

### After lists and tables

- Item one
- Item two
{.checklist}

## Usage

% Remark
> ```sh
> npm install @saeris/remd-attrs
> ```
%% Unified
> ```ts
> import { unified } from "unified";
> import remarkParse from "remark-parse";
> import remarkRehype from "remark-rehype";
> import rehypeStringify from "rehype-stringify";
> import { remarkAttrs } from "@saeris/remd-attrs";
>
> const processor = unified()
>   .use(remarkParse)
>   .use(remarkAttrs)
>   .use(remarkRehype)
>   .use(rehypeStringify);
> ```
%% Astro
> ```ts
> // astro.config.ts
> import { defineConfig } from "astro/config";
> import { remarkAttrs } from "@saeris/remd-attrs";
>
> export default defineConfig({
>   markdown: {
>     remarkPlugins: [remarkAttrs],
>   },
> });
> ```
%% VitePress
> ```ts
> // .vitepress/config.ts
> import { defineConfig } from "vitepress";
> import { remarkAttrs } from "@saeris/remd-attrs";
>
> export default defineConfig({
>   markdown: {
>     remarkPlugins: [remarkAttrs],
>   },
> });
> ```
% Markdown-It
> ```sh
> npm install @saeris/mdit-attrs
> ```
%% Standalone
> ```ts
> import MarkdownIt from "markdown-it";
> import { attrs } from "@saeris/mdit-attrs";
>
> const md = new MarkdownIt().use(attrs);
> ```
%% VitePress
> ```ts
> // .vitepress/config.ts
> import { defineConfig } from "vitepress";
> import { attrs } from "@saeris/mdit-attrs";
>
> export default defineConfig({
>   markdown: {
>     config: (md) => md.use(attrs),
>   },
> });
> ```
