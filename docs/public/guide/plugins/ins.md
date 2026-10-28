---
title: ins
description: Adds insertion syntax using ++double plus signs++.
---

<style>
  @import url("../../markdown.css");
</style>

## Overview

The `ins` plugin renders `++text++` as an HTML `<ins>` element, representing inserted or added text.

```html
<ins>text</ins>
```

## Syntax

Wrap text in double plus signs to mark it as inserted:

% Demo
> ++This text has been inserted.++
>
> You can use it inline: the price is now ++$35++ (was $50).
% Code
> ````markdown
> ++This text has been inserted.++
>
> You can use it inline: the price is now ++$35++ (was $50).
> ````

## Usage

% Remark
> ```sh
> npm install @mirrordown/remd-ins
> ```
%% Unified
> ```ts
> import { unified } from "unified";
> import remarkParse from "remark-parse";
> import remarkRehype from "remark-rehype";
> import rehypeStringify from "rehype-stringify";
> import { remarkIns } from "@mirrordown/remd-ins";
>
> const processor = unified()
>   .use(remarkParse)
>   .use(remarkIns)
>   .use(remarkRehype)
>   .use(rehypeStringify);
> ```
%% Astro
> ```ts
> // astro.config.ts
> import { defineConfig } from "astro/config";
> import { remarkIns } from "@mirrordown/remd-ins";
>
> export default defineConfig({
>   markdown: {
>     remarkPlugins: [remarkIns],
>   },
> });
> ```
% Markdown-It
> ```sh
> npm install @mirrordown/mdit-ins
> ```
%% Standalone
> ```ts
> import MarkdownIt from "markdown-it";
> import { ins } from "@mirrordown/mdit-ins";
>
> const md = new MarkdownIt().use(ins);
> ```
%% VitePress
> ```ts
> // .vitepress/config.ts
> import { defineConfig } from "vitepress";
> import { ins } from "@mirrordown/mdit-ins";
>
> export default defineConfig({
>   markdown: {
>     config: (md) => md.use(ins),
>   },
> });
> ```
% Sätteri
> ```sh
> npm install @mirrordown/sat-ins
> ```
%% Standalone
> ```ts
> import { markdownToHtml } from "satteri";
> import { satteriIns } from "@mirrordown/sat-ins";
>
> const { html } = markdownToHtml(source, {
>   mdastPlugins: [satteriIns()],
> });
> ```
%% Astro
> ```ts
> // astro.config.ts
> import { defineConfig } from "astro/config";
> import { satteri } from "@astrojs/markdown-satteri";
> import { satteriIns } from "@mirrordown/sat-ins";
>
> export default defineConfig({
>   markdown: {
>     processor: satteri({ mdastPlugins: [satteriIns()] }),
>   },
> });
> ```
