---
title: sub
description: Adds subscript syntax using ~tilde~.
---

<style>
  @import url("../markdown.css");
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

## Usage

% Remark
> ```sh
> npm install @saeris/remd-sub
> ```
%% Unified
> ```ts
> import { unified } from "unified";
> import remarkParse from "remark-parse";
> import remarkRehype from "remark-rehype";
> import rehypeStringify from "rehype-stringify";
> import { remarkSub } from "@saeris/remd-sub";
>
> const processor = unified()
>   .use(remarkParse)
>   .use(remarkSub)
>   .use(remarkRehype)
>   .use(rehypeStringify);
> ```
%% Astro
> ```ts
> // astro.config.ts
> import { defineConfig } from "astro/config";
> import { remarkSub } from "@saeris/remd-sub";
>
> export default defineConfig({
>   markdown: {
>     remarkPlugins: [remarkSub],
>   },
> });
> ```
%% VitePress
> ```ts
> // .vitepress/config.ts
> import { defineConfig } from "vitepress";
> import { remarkSub } from "@saeris/remd-sub";
>
> export default defineConfig({
>   markdown: {
>     remarkPlugins: [remarkSub],
>   },
> });
> ```
% Markdown-It
> ```sh
> npm install @saeris/mdit-sub
> ```
%% Standalone
> ```ts
> import MarkdownIt from "markdown-it";
> import { sub } from "@saeris/mdit-sub";
>
> const md = new MarkdownIt().use(sub);
> ```
%% VitePress
> ```ts
> // .vitepress/config.ts
> import { defineConfig } from "vitepress";
> import { sub } from "@saeris/mdit-sub";
>
> export default defineConfig({
>   markdown: {
>     config: (md) => md.use(sub),
>   },
> });
> ```
