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
> It parses each base and reading on its own, with the document's features. Sätteri before 0.11.3 doesn't tell plugins those, so there, pass it the `features` you compile with, as in the Astro example (Astro's Sätteri integration is still on 0.10). List it before other mdast plugins, since it re-reads its blocks from source. The Sätteri preset does both for you.
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
> const features = { gfm: true, smartPunctuation: false };
> export default defineConfig({
>   markdown: {
>     processor: satteri({ features, mdastPlugins: [satteriRuby({ features })] }),
>   },
> });
> ```
