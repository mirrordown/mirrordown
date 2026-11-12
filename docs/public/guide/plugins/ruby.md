---
title: ruby
description: Adds ruby annotation syntax for East Asian typography using {base|reading}.
---

<style>
  @import url("../../markdown.css");
</style>

## Overview

The `ruby` plugin renders `{base|reading}` as HTML `<ruby>` annotations, used for pronunciation guides in East Asian text.

```html
<ruby>base<rt>reading</rt></ruby>
```

## Syntax

Use `{base text|reading}` inline to annotate characters with their pronunciation or reading:

% Demo
> {漢字|かんじ} are Chinese-derived characters used in Japanese writing.
>
> {東京|とうきょう} is the capital of Japan.
% Code
> ````markdown
> {漢字|かんじ} are Chinese-derived characters used in Japanese writing.
>
> {東京|とうきょう} is the capital of Japan.
> ````

A ruby is written on one line, and its first `|` splits it: the base holds no `{`, `}` or `|` (though it may start with `{`), and the reading runs to the next `}`. Spaces and tabs around the base and around the reading are dropped. A brace group without a `|`, such as an attribute block (`{.class}`), is never a ruby, and a ruby written right after one still is. Write `\{` to keep a brace literal. In a table cell, write the separator as `\|`.

Optionally pass `rp` parentheses for fallback rendering in unsupported browsers:

## Usage

% Remark
> ```sh
> npm install @mirrordown/remd-ruby
> ```
%% Unified
> ```ts
> import { unified } from "unified";
> import remarkParse from "remark-parse";
> import remarkRehype from "remark-rehype";
> import rehypeStringify from "rehype-stringify";
> import { remarkRuby } from "@mirrordown/remd-ruby";
>
> const processor = unified()
>   .use(remarkParse)
>   .use(remarkRuby)
>   .use(remarkRehype)
>   .use(rehypeStringify);
>
> // With ruby parentheses for fallback support:
> const processorWithRp = unified()
>   .use(remarkParse)
>   .use(remarkRuby, { rp: ["(", ")"] })
>   .use(remarkRehype)
>   .use(rehypeStringify);
> ```
%% Astro
> ```ts
> // astro.config.ts
> import { defineConfig } from "astro/config";
> import { remarkRuby } from "@mirrordown/remd-ruby";
>
> export default defineConfig({
>   markdown: {
>     remarkPlugins: [remarkRuby],
>   },
> });
> ```
% Markdown-It
> ```sh
> npm install @mirrordown/mdit-ruby
> ```
%% Standalone
> ```ts
> import MarkdownIt from "markdown-it";
> import { ruby } from "@mirrordown/mdit-ruby";
>
> const md = new MarkdownIt().use(ruby);
> ```
%% VitePress
> ```ts
> // .vitepress/config.ts
> import { defineConfig } from "vitepress";
> import { ruby } from "@mirrordown/mdit-ruby";
>
> export default defineConfig({
>   markdown: {
>     config: (md) => md.use(ruby),
>   },
> });
> ```
% Sätteri
> ```sh
> npm install @mirrordown/sat-ruby
> ```
>
> It parses each base and reading on its own, with the document's features. List it first among the mdast plugins, since it re-reads its blocks from source: listed after a plugin that has already rebuilt a block, it only finds a ruby that sits whole inside one text node. The Sätteri preset does this for you.
>
> With Sätteri's `attributes` feature on, a brace group that ends a block is read as an attribute block before any plugin runs, so a ruby there whose base starts with `.` or `#`, or holds `=`, is lost (`{.NET|ドットネット}` alone on a line). Put text after such a ruby.
%% Standalone
> ```ts
> import { markdownToHtml } from "satteri";
> import { satteriRuby } from "@mirrordown/sat-ruby";
>
> const { html } = markdownToHtml(source, {
>   mdastPlugins: [satteriRuby()],
> });
> ```
%% Astro
> ```ts
> // astro.config.ts
> import { defineConfig } from "astro/config";
> import { satteri } from "@astrojs/markdown-satteri";
> import { satteriRuby } from "@mirrordown/sat-ruby";
>
> export default defineConfig({
>   markdown: {
>     processor: satteri({ mdastPlugins: [satteriRuby()] }),
>   },
> });
> ```
