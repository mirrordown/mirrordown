---
title: sub
description: Adds subscript syntax using ~tilde~.
---

<style>
  @import url("../../markdown.css");
</style>

## Overview

The `sub` plugin renders `~text~` as an HTML `<sub>` element, representing subscript text.

```html
<sub>text</sub>
```

## Syntax

Wrap text in single tildes to render it as subscript:

% Demo
> The chemical formula for water is H~2~O.
>
> Carbon dioxide is CO~2~.
% Code
> ````markdown
> The chemical formula for water is H~2~O.
>
> Carbon dioxide is CO~2~.
> ````

### Formatting inside

The content is inline markup, like emphasis: it can hold spaces, other formatting and superscript, but can't start or end with a space.

% Demo
> x~n^2^~ and the ~*base* index~
% Code
> ````markdown
> x~n^2^~ and the ~*base* index~
> ````

A backslash keeps a tilde literal (`H\~2\~O`). Asterisks wrapped tightly around a subscript inside a word (`H**~2~**O`) are emphasis only with GFM, which lets emphasis sit against a `~`; in markdown-it that is the `strikethrough` rule, on by default. A few things differ between the engines:

- Spans have to nest. When a subscript crosses another span or crosses emphasis (`~a *b~ c*`, `==a ~b== c~`), each engine resolves it its own way.
- With GFM off, Sätteri still reads `~~…~~` as a pair and finds no subscript inside it (`~~H~2~O~~`). markdown-it and remark do.
- Sätteri's subscript takes no attribute block: `x~2~{.s}` sets the class with the markdown-it and remark attrs plugins and keeps the braces as text on Sätteri.

## Usage

% Remark
> ```sh
> npm install @mirrordown/remd-sub
> ```
%% Unified
> ```ts
> import { unified } from "unified";
> import remarkParse from "remark-parse";
> import remarkRehype from "remark-rehype";
> import rehypeStringify from "rehype-stringify";
> import { remarkSub } from "@mirrordown/remd-sub";
>
> const processor = unified()
>   .use(remarkParse)
>   // With GFM, turn off single-tilde strikethrough. Left on, whichever of the two plugins is added later takes `~text~`:
>   // .use(remarkGfm, { singleTilde: false })
>   .use(remarkSub)
>   .use(remarkRehype)
>   .use(rehypeStringify);
> ```
%% Astro
> ```ts
> // astro.config.ts
> import { defineConfig } from "astro/config";
> import remarkGfm from "remark-gfm";
> import { remarkSub } from "@mirrordown/remd-sub";
>
> export default defineConfig({
>   markdown: {
>     // Astro's own GFM keeps single-tilde strikethrough on. Replacing it means `~text~` doesn't depend on the order plugins are added in.
>     gfm: false,
>     remarkPlugins: [[remarkGfm, { singleTilde: false }], remarkSub],
>   },
> });
> ```
% Markdown-It
> ```sh
> npm install @mirrordown/mdit-sub
> ```
%% Standalone
> ```ts
> import MarkdownIt from "markdown-it";
> import { sub } from "@mirrordown/mdit-sub";
>
> const md = new MarkdownIt().use(sub);
> ```
%% VitePress
> ```ts
> // .vitepress/config.ts
> import { defineConfig } from "vitepress";
> import { sub } from "@mirrordown/mdit-sub";
>
> export default defineConfig({
>   markdown: {
>     config: (md) => md.use(sub),
>   },
> });
> ```
% Sätteri
> Sätteri parses `~sub~` itself: turn on its `subscript` feature. No Mirrordown package is needed.
%% Standalone
> ```ts
> import { markdownToHtml } from "satteri";
>
> const { html } = markdownToHtml(source, {
>   features: { subscript: true },
> });
> ```
%% Astro
> ```ts
> // astro.config.ts
> import { defineConfig } from "astro/config";
> import { satteri } from "@astrojs/markdown-satteri";
>
> export default defineConfig({
>   markdown: {
>     processor: satteri({ features: { subscript: true } }),
>   },
> });
> ```
