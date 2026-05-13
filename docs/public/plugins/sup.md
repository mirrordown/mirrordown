---
title: sup
description: Adds superscript syntax using ^caret^.
---

<style>
  @import url("../markdown.css");
</style>

## Overview

The `sup` plugin renders `^text^` as an HTML `<sup>` element, representing superscript text.

```html
<sup>text</sup>
```

## Syntax

Wrap text in single carets to render it as superscript:

E = mc^2^

The Pythagorean theorem: a^2^ + b^2^ = c^2^

## Usage

% Remark
> ```sh
> npm install @saeris/remd-sup
> ```
%% Unified
> ```ts
> import { unified } from "unified";
> import remarkParse from "remark-parse";
> import remarkRehype from "remark-rehype";
> import rehypeStringify from "rehype-stringify";
> import { remarkSup } from "@saeris/remd-sup";
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
> import { remarkSup } from "@saeris/remd-sup";
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
> import { remarkSup } from "@saeris/remd-sup";
>
> export default defineConfig({
>   markdown: {
>     remarkPlugins: [remarkSup],
>   },
> });
> ```
% Markdown-It
> ```sh
> npm install @saeris/mdit-sup
> ```
%% Standalone
> ```ts
> import MarkdownIt from "markdown-it";
> import { sup } from "@saeris/mdit-sup";
>
> const md = new MarkdownIt().use(sup);
> ```
%% VitePress
> ```ts
> // .vitepress/config.ts
> import { defineConfig } from "vitepress";
> import { sup } from "@saeris/mdit-sup";
>
> export default defineConfig({
>   markdown: {
>     config: (md) => md.use(sup),
>   },
> });
> ```
