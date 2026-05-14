---
title: mark
description: Adds highlight syntax using ==double equals==.
---

<style>
  @import url("../markdown.css");
</style>

## Overview

The `mark` plugin renders `==text==` as an HTML `<mark>` element, representing highlighted or marked text.

```html
<mark>text</mark>
```

## Syntax

Wrap text in double equals signs to highlight it:

% Demo
> ==This text is highlighted.==
>
> You can use it inline: remember to ==save your work== before closing.
% Code
> ````markdown
> ==This text is highlighted.==
>
> You can use it inline: remember to ==save your work== before closing.
> ````

## Usage

% Remark
> ```sh
> npm install @saeris/remd-mark
> ```
%% Unified
> ```ts
> import { unified } from "unified";
> import remarkParse from "remark-parse";
> import remarkRehype from "remark-rehype";
> import rehypeStringify from "rehype-stringify";
> import { remarkMark } from "@saeris/remd-mark";
>
> const processor = unified()
>   .use(remarkParse)
>   .use(remarkMark)
>   .use(remarkRehype)
>   .use(rehypeStringify);
> ```
%% Astro
> ```ts
> // astro.config.ts
> import { defineConfig } from "astro/config";
> import { remarkMark } from "@saeris/remd-mark";
>
> export default defineConfig({
>   markdown: {
>     remarkPlugins: [remarkMark],
>   },
> });
> ```
%% VitePress
> ```ts
> // .vitepress/config.ts
> import { defineConfig } from "vitepress";
> import { remarkMark } from "@saeris/remd-mark";
>
> export default defineConfig({
>   markdown: {
>     remarkPlugins: [remarkMark],
>   },
> });
> ```
% Markdown-It
> ```sh
> npm install @saeris/mdit-mark
> ```
%% Standalone
> ```ts
> import MarkdownIt from "markdown-it";
> import { mark } from "@saeris/mdit-mark";
>
> const md = new MarkdownIt().use(mark);
> ```
%% VitePress
> ```ts
> // .vitepress/config.ts
> import { defineConfig } from "vitepress";
> import { mark } from "@saeris/mdit-mark";
>
> export default defineConfig({
>   markdown: {
>     config: (md) => md.use(mark),
>   },
> });
> ```
