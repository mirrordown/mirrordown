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

> [!NOTE]
> Formatting that crosses a key's brackets, such as `[[*a]]*`, renders differently by engine: markdown-it reads the key first, while remark and Sätteri have already read the emphasis when the plugin runs. Keep formatting inside or outside the brackets.

A key holds inline content on one line: a code span, an autolink or a link inside it is one unit, so a `]]` inside a code span does not close the key, and a line break before the closing `]]` leaves the text as it is. Keys nest up to 100 deep; deeper brackets stay text. A backslash keeps a bracket literal (`\[[not a key]]`), and so does writing it as a character reference (`&#91;`). An attribute block written right after a key (`[[Enter]]{.name}`) goes on the `<kbd>`, with the [`attrs`](/guide/plugins/attrs) plugin or Sätteri's `attributes` feature on.

Where the brackets could also be read as a link, the key wins: `[[Enter]]` is a key even when the document defines `[Enter]: …`, and `[[a]](url)` is a key followed by `(url)`. A few things differ between the engines:

- When a key shares its opening brackets with a link (`[[a](url)]]`), markdown-it parses what is left of the link syntax again, while remark and Sätteri show it as written. A character reference or formatting in that leftover, or a reference link with more link syntax straight after it (`[[a][ref](url)]]`), renders differently.
- In image alt text (`![[[a]]](pic.png)`), markdown-it drops the brackets and remark and Sätteri keep the text as written.
- In remark and Sätteri, list the kbd plugin before the del, ins, mark and spoiler plugins, as the presets do. A key's brackets then keep the delimiters inside it apart from those outside, as in markdown-it, where the order doesn't matter: listed after them, `--[[a-- b]]--` pairs the first two `--` and no key is left.
- The remark plugin reads escapes from the source, so it needs the file: `processor.runSync(tree)` on a tree alone treats `\[[` as `[[`.

## Usage

% Remark
> ```sh
> npm install @mirrordown/remd-kbd
> ```
%% Unified
> ```ts
> import { unified } from "unified";
> import remarkParse from "remark-parse";
> import remarkRehype from "remark-rehype";
> import rehypeStringify from "rehype-stringify";
> import { remarkKbd } from "@mirrordown/remd-kbd";
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
> import { remarkKbd } from "@mirrordown/remd-kbd";
>
> export default defineConfig({
>   markdown: {
>     remarkPlugins: [remarkKbd],
>   },
> });
> ```
% Markdown-It
> ```sh
> npm install @mirrordown/mdit-kbd
> ```
%% Standalone
> ```ts
> import MarkdownIt from "markdown-it";
> import { kbd } from "@mirrordown/mdit-kbd";
>
> const md = new MarkdownIt().use(kbd);
> ```
%% VitePress
> ```ts
> // .vitepress/config.ts
> import { defineConfig } from "vitepress";
> import { kbd } from "@mirrordown/mdit-kbd";
>
> export default defineConfig({
>   markdown: {
>     config: (md) => md.use(kbd),
>   },
> });
> ```
% Sätteri
> ```sh
> npm install @mirrordown/sat-kbd
> ```
>
> Leave Sätteri's `wikilinks` feature off: it reads `[[…]]` as a link first.
%% Standalone
> ```ts
> import { markdownToHtml } from "satteri";
> import { satteriKbd } from "@mirrordown/sat-kbd";
>
> const { html } = markdownToHtml(source, {
>   mdastPlugins: [satteriKbd()],
> });
> ```
%% Astro
> ```ts
> // astro.config.ts
> import { defineConfig } from "astro/config";
> import { satteri } from "@astrojs/markdown-satteri";
> import { satteriKbd } from "@mirrordown/sat-kbd";
>
> export default defineConfig({
>   markdown: {
>     processor: satteri({ mdastPlugins: [satteriKbd()] }),
>   },
> });
> ```
