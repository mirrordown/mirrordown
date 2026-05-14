---
title: ins
description: Adds insertion syntax using ++double plus signs++.
---

<style>
  @import url("../markdown.css");
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
> npm install @saeris/remd-ins
> ```
%% Unified
> ```ts
> import { unified } from "unified";
> import remarkParse from "remark-parse";
> import remarkRehype from "remark-rehype";
> import rehypeStringify from "rehype-stringify";
> import { remarkIns } from "@saeris/remd-ins";
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
> import { remarkIns } from "@saeris/remd-ins";
>
> export default defineConfig({
>   markdown: {
>     remarkPlugins: [remarkIns],
>   },
> });
> ```
%% VitePress
> ```ts
> // .vitepress/config.ts
> import { defineConfig } from "vitepress";
> import { remarkIns } from "@saeris/remd-ins";
>
> export default defineConfig({
>   markdown: {
>     remarkPlugins: [remarkIns],
>   },
> });
> ```
% Markdown-It
> ```sh
> npm install @saeris/mdit-ins
> ```
%% Standalone
> ```ts
> import MarkdownIt from "markdown-it";
> import { ins } from "@saeris/mdit-ins";
>
> const md = new MarkdownIt().use(ins);
> ```
%% VitePress
> ```ts
> // .vitepress/config.ts
> import { defineConfig } from "vitepress";
> import { ins } from "@saeris/mdit-ins";
>
> export default defineConfig({
>   markdown: {
>     config: (md) => md.use(ins),
>   },
> });
> ```
