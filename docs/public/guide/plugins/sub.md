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
>   // With GFM, turn off single-tilde strikethrough, which would take `~text~` first:
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
>     // Astro's own GFM uses single-tilde strikethrough, which takes `~text~` first.
>     gfm: false,
>     remarkPlugins: [[remarkGfm, { singleTilde: false }], remarkSub],
>   },
> });
> ```
%% VitePress
> ```ts
> // .vitepress/config.ts
> import { defineConfig } from "vitepress";
> import { remarkSub } from "@mirrordown/remd-sub";
>
> export default defineConfig({
>   markdown: {
>     remarkPlugins: [remarkSub],
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
