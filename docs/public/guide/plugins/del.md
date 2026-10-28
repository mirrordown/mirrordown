---
title: del
description: Adds strikethrough/delete syntax using --double dashes--.
---

<style>
  @import url("../../markdown.css");
</style>

## Overview

The `del` plugin renders `--text--` as an HTML `<del>` element, representing deleted or struck-through text.

```html
<del>text</del>
```

## Syntax

Wrap text in double dashes to mark it as deleted:

% Demo
> --This text has been deleted.--
>
> You can use it inline: the price was --$50-- $35.
% Code
> ````markdown
> --This text has been deleted.--
>
> You can use it inline: the price was --$50-- $35.
> ````

> [!NOTE]
> Smart punctuation rewrites `--` as an en dash before this plugin sees it, and Astro turns it on by default (`smartypants` for remark, `smartPunctuation` for Sätteri). Turn it off, or use a Mirrordown preset, which does.

## Usage

% Remark
> ```sh
> npm install @mirrordown/remd-del
> ```
>
%% Unified
> ```ts
> import { unified } from "unified";
> import remarkParse from "remark-parse";
> import remarkRehype from "remark-rehype";
> import rehypeStringify from "rehype-stringify";
> import { remarkDel } from "@mirrordown/remd-del";
>
> const processor = unified()
>   .use(remarkParse)
>   .use(remarkDel)
>   .use(remarkRehype)
>   .use(rehypeStringify);
> ```
%% Astro
> ```ts
> // astro.config.ts
> import { defineConfig } from "astro/config";
> import { remarkDel } from "@mirrordown/remd-del";
>
> export default defineConfig({
>   markdown: {
>     remarkPlugins: [remarkDel],
>   },
> });
> ```
% Markdown-It
> ```sh
> npm install @mirrordown/mdit-del
> ```
>
%% Standalone
> ```ts
> import MarkdownIt from "markdown-it";
> import { del } from "@mirrordown/mdit-del";
>
> const md = new MarkdownIt().use(del);
> ```
%% VitePress
> ```ts
> // .vitepress/config.ts
> import { defineConfig } from "vitepress";
> import { del } from "@mirrordown/mdit-del";
>
> export default defineConfig({
>   markdown: {
>     config: (md) => md.use(del),
>   },
> });
> ```
% Sätteri
> ```sh
> npm install @mirrordown/sat-del
> ```
%% Standalone
> ```ts
> import { markdownToHtml } from "satteri";
> import { satteriDel } from "@mirrordown/sat-del";
>
> const { html } = markdownToHtml(source, {
>   mdastPlugins: [satteriDel()],
> });
> ```
%% Astro
> ```ts
> // astro.config.ts
> import { defineConfig } from "astro/config";
> import { satteri } from "@astrojs/markdown-satteri";
> import { satteriDel } from "@mirrordown/sat-del";
>
> export default defineConfig({
>   markdown: {
>     processor: satteri({ mdastPlugins: [satteriDel()] }),
>   },
> });
> ```
