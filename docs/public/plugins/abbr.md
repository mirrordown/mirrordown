---
title: abbr
description: Adds abbreviation definitions that auto-expand matching text with tooltips.
---

<style>
  @import url("../markdown.css");
</style>

## Overview

The `abbr` plugin lets you define abbreviations once and automatically wraps every occurrence in an `<abbr>` element with a `title` attribute for the full expansion.

```html
<abbr title="HyperText Markup Language">HTML</abbr>
```

## Syntax

Define abbreviations anywhere in the document using the `*[ABBR]: Full text` syntax. Definitions are removed from the output and all matching words are wrapped automatically.

*[HTML]: HyperText Markup Language
*[CSS]: Cascading Style Sheets

Write HTML and CSS as normal — they are automatically expanded with tooltips.

## Usage

% Remark
> ```sh
> npm install @saeris/remd-abbr
> ```
%% Unified
> ```ts
> import { unified } from "unified";
> import remarkParse from "remark-parse";
> import remarkRehype from "remark-rehype";
> import rehypeStringify from "rehype-stringify";
> import { remarkAbbr } from "@saeris/remd-abbr";
>
> const processor = unified()
>   .use(remarkParse)
>   .use(remarkAbbr)
>   .use(remarkRehype)
>   .use(rehypeStringify);
> ```
%% Astro
> ```ts
> // astro.config.ts
> import { defineConfig } from "astro/config";
> import { remarkAbbr } from "@saeris/remd-abbr";
>
> export default defineConfig({
>   markdown: {
>     remarkPlugins: [remarkAbbr],
>   },
> });
> ```
%% VitePress
> ```ts
> // .vitepress/config.ts
> import { defineConfig } from "vitepress";
> import { remarkAbbr } from "@saeris/remd-abbr";
>
> export default defineConfig({
>   markdown: {
>     remarkPlugins: [remarkAbbr],
>   },
> });
> ```
% Markdown-It
> ```sh
> npm install @saeris/mdit-abbr
> ```
%% Standalone
> ```ts
> import MarkdownIt from "markdown-it";
> import { abbr } from "@saeris/mdit-abbr";
>
> const md = new MarkdownIt().use(abbr);
> ```
%% VitePress
> ```ts
> // .vitepress/config.ts
> import { defineConfig } from "vitepress";
> import { abbr } from "@saeris/mdit-abbr";
>
> export default defineConfig({
>   markdown: {
>     config: (md) => md.use(abbr),
>   },
> });
> ```
