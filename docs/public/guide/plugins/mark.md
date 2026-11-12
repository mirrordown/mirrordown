---
title: mark
description: Adds highlight syntax using ==double equals==.
---

<style>
  @import url("../../markdown.css");
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

A delimiter needs text right against it, as emphasis does: an opening `==` can't be followed by a space and a closing one can't follow a space, so `a == b == c` stays as written. Of a run of three, one equals sign stays outside (`===a===` is a highlight between two equals signs). A highlight can run over a line break, not over a blank line. A URL written bare in the text is read like any other text, also where GFM makes it a link (`https://example.com/a==b==c` highlights the `b`): write it as an autolink (`<https://…>`) or as a link's target to keep it whole.

A backslash keeps a delimiter literal (`\==not highlighted==`), and so does writing an equals sign as a character reference (`&#61;`). Highlights nest up to 100 deep; the markers of deeper ones stay text. An attribute block written right after a highlight (`==text=={.name}`) goes on the `<mark>`, with the [`attrs`](/guide/plugins/attrs) plugin or Sätteri's `attributes` feature on. A few things differ between the engines:

- Spans have to nest. When a span crosses another one or crosses emphasis (`==a *b== c*`, `==a --b== c--`), each engine resolves it its own way, and in remark and Sätteri the result depends on the order the plugins are listed in.
- In image alt text (`![==a==](x.png)`), markdown-it drops the equals signs and remark and Sätteri keep the text as written.
- The remark plugin reads escapes from the source, so it needs the file: `processor.runSync(tree)` on a tree alone treats `\==` as `==`.

## Usage

% Remark
> ```sh
> npm install @mirrordown/remd-mark
> ```
%% Unified
> ```ts
> import { unified } from "unified";
> import remarkParse from "remark-parse";
> import remarkRehype from "remark-rehype";
> import rehypeStringify from "rehype-stringify";
> import { remarkMark } from "@mirrordown/remd-mark";
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
> import { remarkMark } from "@mirrordown/remd-mark";
>
> export default defineConfig({
>   markdown: {
>     remarkPlugins: [remarkMark],
>   },
> });
> ```
% Markdown-It
> ```sh
> npm install @mirrordown/mdit-mark
> ```
%% Standalone
> ```ts
> import MarkdownIt from "markdown-it";
> import { mark } from "@mirrordown/mdit-mark";
>
> const md = new MarkdownIt().use(mark);
> ```
%% VitePress
> ```ts
> // .vitepress/config.ts
> import { defineConfig } from "vitepress";
> import { mark } from "@mirrordown/mdit-mark";
>
> export default defineConfig({
>   markdown: {
>     config: (md) => md.use(mark),
>   },
> });
> ```
% Sätteri
> ```sh
> npm install @mirrordown/sat-mark
> ```
%% Standalone
> ```ts
> import { markdownToHtml } from "satteri";
> import { satteriMark } from "@mirrordown/sat-mark";
>
> const { html } = markdownToHtml(source, {
>   mdastPlugins: [satteriMark()],
> });
> ```
%% Astro
> ```ts
> // astro.config.ts
> import { defineConfig } from "astro/config";
> import { satteri } from "@astrojs/markdown-satteri";
> import { satteriMark } from "@mirrordown/sat-mark";
>
> export default defineConfig({
>   markdown: {
>     processor: satteri({ mdastPlugins: [satteriMark()] }),
>   },
> });
> ```
