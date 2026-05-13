---
title: ruby
description: Adds ruby annotation syntax for East Asian typography using {base|reading}.
---

<style>
  @import url("../markdown.css");
</style>

## Overview

The `ruby` plugin renders `{base|reading}` as HTML `<ruby>` annotations, used for pronunciation guides in East Asian text.

```html
<ruby>base<rt>reading</rt></ruby>
```

## Syntax

Use `{base text|reading}` inline to annotate characters with their pronunciation or reading:

{漢字|かんじ} are Chinese-derived characters used in Japanese writing.

{東京|とうきょう} is the capital of Japan.

Optionally pass `rp` parentheses for fallback rendering in unsupported browsers:

## Usage

% Remark
> ```sh
> npm install @saeris/remd-ruby
> ```
%% Unified
> ```ts
> import { unified } from "unified";
> import remarkParse from "remark-parse";
> import remarkRehype from "remark-rehype";
> import rehypeStringify from "rehype-stringify";
> import { remarkRuby } from "@saeris/remd-ruby";
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
> import { remarkRuby } from "@saeris/remd-ruby";
>
> export default defineConfig({
>   markdown: {
>     remarkPlugins: [remarkRuby],
>   },
> });
> ```
%% VitePress
> ```ts
> // .vitepress/config.ts
> import { defineConfig } from "vitepress";
> import { remarkRuby } from "@saeris/remd-ruby";
>
> export default defineConfig({
>   markdown: {
>     remarkPlugins: [remarkRuby],
>   },
> });
> ```
% Markdown-It
> ```sh
> npm install @saeris/mdit-ruby
> ```
%% Standalone
> ```ts
> import MarkdownIt from "markdown-it";
> import { ruby } from "@saeris/mdit-ruby";
>
> const md = new MarkdownIt().use(ruby);
> ```
%% VitePress
> ```ts
> // .vitepress/config.ts
> import { defineConfig } from "vitepress";
> import { ruby } from "@saeris/mdit-ruby";
>
> export default defineConfig({
>   markdown: {
>     config: (md) => md.use(ruby),
>   },
> });
> ```
