---
title: abbr
description: Adds abbreviation definitions that auto-expand matching text with tooltips.
---

<style>
  @import url("../../markdown.css");
</style>

## Overview

The `abbr` plugin lets you define abbreviations once and automatically wraps every occurrence in an `<abbr>` element with a `title` attribute for the full expansion.

```html
<abbr title="HyperText Markup Language">HTML</abbr>
```

## Syntax

Define abbreviations anywhere in the document using the `*[ABBR]: Full text` syntax. Definitions are removed from the output and all matching words are wrapped automatically.

% Demo
> *[HTML]: HyperText Markup Language
> *[CSS]: Cascading Style Sheets
>
> Write HTML and CSS as normal — they are automatically expanded with tooltips.
% Code
> ````markdown
> *[HTML]: HyperText Markup Language
> *[CSS]: Cascading Style Sheets
>
> Write HTML and CSS as normal — they are automatically expanded with tooltips.
> ````

## Usage

% Remark
> ```sh
> npm install @mirrordown/remd-abbr
> ```
%% Unified
> ```ts
> import { unified } from "unified";
> import remarkParse from "remark-parse";
> import remarkRehype from "remark-rehype";
> import rehypeStringify from "rehype-stringify";
> import { remarkAbbr } from "@mirrordown/remd-abbr";
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
> import { remarkAbbr } from "@mirrordown/remd-abbr";
>
> export default defineConfig({
>   markdown: {
>     remarkPlugins: [remarkAbbr],
>   },
> });
> ```
% Markdown-It
> ```sh
> npm install @mirrordown/mdit-abbr
> ```
%% Standalone
> ```ts
> import MarkdownIt from "markdown-it";
> import { abbr } from "@mirrordown/mdit-abbr";
>
> const md = new MarkdownIt().use(abbr);
> ```
%% VitePress
> ```ts
> // .vitepress/config.ts
> import { defineConfig } from "vitepress";
> import { abbr } from "@mirrordown/mdit-abbr";
>
> export default defineConfig({
>   markdown: {
>     config: (md) => md.use(abbr),
>   },
> });
> ```
% Sätteri
> ```sh
> npm install @mirrordown/sat-abbr
> ```
%% Standalone
> ```ts
> import { markdownToHtml } from "satteri";
> import { satteriAbbr } from "@mirrordown/sat-abbr";
>
> const { html } = markdownToHtml(source, {
>   mdastPlugins: [satteriAbbr()],
> });
> ```
%% Astro
> ```ts
> // astro.config.ts
> import { defineConfig } from "astro/config";
> import { satteri } from "@astrojs/markdown-satteri";
> import { satteriAbbr } from "@mirrordown/sat-abbr";
>
> export default defineConfig({
>   markdown: {
>     processor: satteri({ mdastPlugins: [satteriAbbr()] }),
>   },
> });
> ```
