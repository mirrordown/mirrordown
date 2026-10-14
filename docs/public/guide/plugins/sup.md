---
title: sup
description: Adds superscript syntax using ^caret^.
---

<style>
  @import url("../../markdown.css");
</style>

## Overview

The `sup` plugin renders `^text^` as an HTML `<sup>` element, representing superscript text.

```html
<sup>text</sup>
```

## Syntax

Wrap text in single carets to render it as superscript:

% Demo
> E = mc^2^
>
> The Pythagorean theorem: a^2^ + b^2^ = c^2^
% Code
> ````markdown
> E = mc^2^
>
> The Pythagorean theorem: a^2^ + b^2^ = c^2^
> ````

## Usage

% Remark
> ```sh
> npm install @mirrordown/remd-sup
> ```
%% Unified
> ```ts
> import { unified } from "unified";
> import remarkParse from "remark-parse";
> import remarkRehype from "remark-rehype";
> import rehypeStringify from "rehype-stringify";
> import { remarkSup } from "@mirrordown/remd-sup";
>
> const processor = unified()
>   .use(remarkParse)
>   .use(remarkSup)
>   .use(remarkRehype)
>   .use(rehypeStringify);
> ```
%% Astro
> ```ts
> // astro.config.ts
> import { defineConfig } from "astro/config";
> import { remarkSup } from "@mirrordown/remd-sup";
>
> export default defineConfig({
>   markdown: {
>     remarkPlugins: [remarkSup],
>   },
> });
> ```
%% VitePress
> ```ts
> // .vitepress/config.ts
> import { defineConfig } from "vitepress";
> import { remarkSup } from "@mirrordown/remd-sup";
>
> export default defineConfig({
>   markdown: {
>     remarkPlugins: [remarkSup],
>   },
> });
> ```
% Markdown-It
> ```sh
> npm install @mirrordown/mdit-sup
> ```
%% Standalone
> ```ts
> import MarkdownIt from "markdown-it";
> import { sup } from "@mirrordown/mdit-sup";
>
> const md = new MarkdownIt().use(sup);
> ```
%% VitePress
> ```ts
> // .vitepress/config.ts
> import { defineConfig } from "vitepress";
> import { sup } from "@mirrordown/mdit-sup";
>
> export default defineConfig({
>   markdown: {
>     config: (md) => md.use(sup),
>   },
> });
> ```
% Sätteri
> Sätteri parses `^sup^` itself: turn on its `superscript` feature. No Mirrordown package is needed.
%% Standalone
> ```ts
> import { markdownToHtml } from "satteri";
>
> const { html } = markdownToHtml(source, {
>   features: { superscript: true },
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
>     processor: satteri({ features: { superscript: true } }),
>   },
> });
> ```
