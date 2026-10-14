---
title: kbd
description: Adds keyboard key syntax using [[double brackets]].
---

<style>
  @import url("../../markdown.css");
</style>

## Overview

The `kbd` plugin renders `[[key]]` as an HTML `<kbd>` element, representing keyboard input or a key name.

```html
<kbd>key</kbd>
```

## Syntax

Wrap a key name in double square brackets:

% Demo
> Press [[Enter]] to confirm.
>
> You can combine multiple keys: [[Ctrl]] + [[Shift]] + [[P]] opens the command palette.
% Code
> ````markdown
> Press [[Enter]] to confirm.
>
> You can combine multiple keys: [[Ctrl]] + [[Shift]] + [[P]] opens the command palette.
> ````

> [!NOTE]
> Formatting that crosses a key's brackets, such as `[[*a]]*`, renders differently by engine: markdown-it reads the key first, while remark and Sätteri have already read the emphasis when the plugin runs. Keep formatting inside or outside the brackets.

## Usage

% Remark
> ```sh
> npm install @mirrordown/remd-kbd
> ```
%% Unified
> ```ts
> import { unified } from "unified";
> import remarkParse from "remark-parse";
> import remarkRehype from "remark-rehype";
> import rehypeStringify from "rehype-stringify";
> import { remarkKbd } from "@mirrordown/remd-kbd";
>
> const processor = unified()
>   .use(remarkParse)
>   .use(remarkKbd)
>   .use(remarkRehype)
>   .use(rehypeStringify);
> ```
%% Astro
> ```ts
> // astro.config.ts
> import { defineConfig } from "astro/config";
> import { remarkKbd } from "@mirrordown/remd-kbd";
>
> export default defineConfig({
>   markdown: {
>     remarkPlugins: [remarkKbd],
>   },
> });
> ```
% Markdown-It
> ```sh
> npm install @mirrordown/mdit-kbd
> ```
%% Standalone
> ```ts
> import MarkdownIt from "markdown-it";
> import { kbd } from "@mirrordown/mdit-kbd";
>
> const md = new MarkdownIt().use(kbd);
> ```
%% VitePress
> ```ts
> // .vitepress/config.ts
> import { defineConfig } from "vitepress";
> import { kbd } from "@mirrordown/mdit-kbd";
>
> export default defineConfig({
>   markdown: {
>     config: (md) => md.use(kbd),
>   },
> });
> ```
% Sätteri
> ```sh
> npm install @mirrordown/sat-kbd
> ```
>
> Leave Sätteri's `wikilinks` feature off: it reads `[[…]]` as a link first.
%% Standalone
> ```ts
> import { markdownToHtml } from "satteri";
> import { satteriKbd } from "@mirrordown/sat-kbd";
>
> const { html } = markdownToHtml(source, {
>   mdastPlugins: [satteriKbd()],
> });
> ```
%% Astro
> ```ts
> // astro.config.ts
> import { defineConfig } from "astro/config";
> import { satteri } from "@astrojs/markdown-satteri";
> import { satteriKbd } from "@mirrordown/sat-kbd";
>
> export default defineConfig({
>   markdown: {
>     processor: satteri({ mdastPlugins: [satteriKbd()] }),
>   },
> });
> ```
