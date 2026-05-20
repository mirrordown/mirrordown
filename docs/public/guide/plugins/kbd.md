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

## Usage

% Remark
> ```sh
> npm install @saeris/remd-kbd
> ```
%% Unified
> ```ts
> import { unified } from "unified";
> import remarkParse from "remark-parse";
> import remarkRehype from "remark-rehype";
> import rehypeStringify from "rehype-stringify";
> import { remarkKbd } from "@saeris/remd-kbd";
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
> import { remarkKbd } from "@saeris/remd-kbd";
>
> export default defineConfig({
>   markdown: {
>     remarkPlugins: [remarkKbd],
>   },
> });
> ```
%% VitePress
> ```ts
> // .vitepress/config.ts
> import { defineConfig } from "vitepress";
> import { remarkKbd } from "@saeris/remd-kbd";
>
> export default defineConfig({
>   markdown: {
>     remarkPlugins: [remarkKbd],
>   },
> });
> ```
% Markdown-It
> ```sh
> npm install @saeris/mdit-kbd
> ```
%% Standalone
> ```ts
> import MarkdownIt from "markdown-it";
> import { kbd } from "@saeris/mdit-kbd";
>
> const md = new MarkdownIt().use(kbd);
> ```
%% VitePress
> ```ts
> // .vitepress/config.ts
> import { defineConfig } from "vitepress";
> import { kbd } from "@saeris/mdit-kbd";
>
> export default defineConfig({
>   markdown: {
>     config: (md) => md.use(kbd),
>   },
> });
> ```
