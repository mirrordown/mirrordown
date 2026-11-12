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

The content is inline markup, like emphasis: it can hold spaces, other formatting and superscript, but can't start or end with a space. As with emphasis, a tilde between a letter or digit and punctuation doesn't open or close one, so `10~-3~` and `H~(2)~O` stay as written; after a space it does (`x ~-1~`).

% Demo
> x~n^2^~ and the ~*base* index~
% Code
> ````markdown
> x~n^2^~ and the ~*base* index~
> ````

A backslash keeps a tilde literal (`H\~2\~O`). Asterisks wrapped tightly around a subscript inside a word (`H**~2~**O`) are emphasis only with GFM, which lets emphasis sit against a `~`; in markdown-it that is the `strikethrough` rule, on by default. A few things differ between the engines:

- Spans have to nest. When a subscript crosses a span another plugin builds (`==a ~b== c~`, `--a ~b-- c~`), each engine resolves it its own way. Crossing emphasis (`~a *b~ c*`) renders the same in all three.
- With GFM off, Sätteri still reads `~~…~~` as a pair and finds no subscript inside it (`~~H~2~O~~`). markdown-it and remark do.
- Sätteri's subscript takes no attribute block: `x~2~{.s}` sets the class with the markdown-it and remark attrs plugins and keeps the braces as text on Sätteri, where a block at the end of a paragraph, heading or list item (`x~2~{.s}` alone on a line) sets the class on that element instead.

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
> Sätteri parses `~sub~` itself: turn on its `subscript` feature. There is no Mirrordown package for it. The built-in renders what the plugins do except where the list under [Formatting inside](#formatting-inside) says otherwise.
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
