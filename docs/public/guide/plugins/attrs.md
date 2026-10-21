---
title: attrs
description: Adds attribute syntax to attach HTML attributes to headings, blocks, inline elements, and more.
---

<style>
  @import url("../../markdown.css");
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

% Demo
> ## My Section {#my-section .highlight}
% Code
> ````markdown
> ## My Section {#my-section .highlight}
> ````

### Code fences

% Demo
> ```ts {.language-typescript data-filename="example.ts"}
> const x = 1;
> ```
% Code
> ````markdown
> ```ts {.language-typescript data-filename="example.ts"}
> const x = 1;
> ```
> ````

### Paragraphs

% Demo
> A paragraph with a custom class.
> {.note}
% Code
> ````markdown
> A paragraph with a custom class.
> {.note}
> ````

### Inline elements

% Demo
> This is **important**{.warning} text.
% Code
> ````markdown
> This is **important**{.warning} text.
> ````

### After lists and tables

% Demo
> - Item one
> - Item two
> {.checklist}
% Code
> ````markdown
> - Item one
> - Item two
> {.checklist}
> ````

### Inside blockquotes and lists

A block on a line of its own goes on the block it's written after, at the level its `>` markers and indentation put it, as kramdown places a block IAL. Written inside a blockquote or list item, it goes on the paragraph, or on the item in a tight list. Written outside one, as a lazy continuation line, it goes on that blockquote, or on the item's list.

% Demo
> > A quoted paragraph.
> > {.note}
>
> > A quoted paragraph.
> {.callout}
>
> - Item one
>   {.first}
> - Item two
% Code
> ````markdown
> > A quoted paragraph.
> > {.note}
>
> > A quoted paragraph.
> {.callout}
>
> - Item one
>   {.first}
> - Item two
> ````

markdown-it-attrs can't see a line's indentation, so it gives such a line to the outermost block that ends with the paragraph instead.

## Usage

% Remark
> ```sh
> npm install @mirrordown/remd-attrs
> ```
%% Unified
> ```ts
> import { unified } from "unified";
> import remarkParse from "remark-parse";
> import remarkRehype from "remark-rehype";
> import rehypeStringify from "rehype-stringify";
> import { remarkAttrs } from "@mirrordown/remd-attrs";
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
> import { remarkAttrs } from "@mirrordown/remd-attrs";
>
> export default defineConfig({
>   markdown: {
>     remarkPlugins: [remarkAttrs],
>   },
> });
> ```
% Markdown-It
> ```sh
> npm install @mirrordown/mdit-attrs
> ```
%% Standalone
> ```ts
> import MarkdownIt from "markdown-it";
> import { attrs } from "@mirrordown/mdit-attrs";
>
> const md = new MarkdownIt().use(attrs);
> ```
%% VitePress
> ```ts
> // .vitepress/config.ts
> import { defineConfig } from "vitepress";
> import { attrs } from "@mirrordown/mdit-attrs";
>
> export default defineConfig({
>   markdown: {
>     config: (md) => md.use(attrs),
>   },
> });
> ```
