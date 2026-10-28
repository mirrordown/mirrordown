---
title: caption
description: "Captions any block with a ~: line written right after it, wrapping the block in a <figure> with a <figcaption>."
---

<style>
  @import url("../../markdown.css");
</style>

## Overview

The `caption` plugin captions a block with a line starting `~:` written right after it. The block goes in a [`<figure>`](https://developer.mozilla.org/docs/Web/HTML/Element/figure), and the caption becomes its [`<figcaption>`](https://developer.mozilla.org/docs/Web/HTML/Element/figcaption):

```html
<figure class="markdown-caption">
  <img src="fuji.jpg" alt="Mount Fuji at dawn">
  <figcaption>Mount Fuji from Lake Kawaguchi.</figcaption>
</figure>
```

Any block can take a caption: an image, a paragraph, a quote, code, a table, a list, and the blocks other plugins add, such as tabs, steps, alerts, definition lists and diagrams.

The marker follows the `~` that [definition lists](/guide/plugins/definition-list) use, with a colon, so it can't be mistaken for one: a term followed by `~ definition` stays a definition list. In renderers without the plugin, the caption stays a line of text.

## Syntax

Write `~:`, a space and the caption on the line right after the block, with no blank line between them. The caption runs to the end of its paragraph and can hold inline markdown.

### Images

An image alone in its paragraph becomes the figure's content. Its alt text stays its alt text, which describes the image to people who can't see it; the caption is for everyone.

% Demo
> ![Mount Fuji at dawn](./assets/fuji.jpg)
> ~: Mount Fuji from Lake Kawaguchi, *at dawn*.
>
% Code
> ````markdown
> ![Mount Fuji at dawn](./assets/fuji.jpg)
> ~: Mount Fuji from Lake Kawaguchi, *at dawn*.
> ````

Several images in one paragraph make one figure. An image inside a sentence isn't a figure of its own, so a caption after it captions the paragraph.

### Quotes

A caption written after a quote, without its `>`, attributes it.

% Demo
> > Simple is better than complex.
> ~: Tim Peters, *The Zen of Python*
>
% Code
> ````markdown
> > Simple is better than complex.
> ~: Tim Peters, *The Zen of Python*
> ````

### Code

% Demo
> ```sh
> npm install @mirrordown/remd-caption
> ```
> ~: Installing the remark plugin
>
% Code
> `````markdown
> ```sh
> npm install @mirrordown/remd-caption
> ```
> ~: Installing the remark plugin
> `````

### Tables

% Demo
> | Engine      | Plugin                      |
> | ----------- | --------------------------- |
> | markdown-it | `@mirrordown/mdit-caption`  |
> | remark      | `@mirrordown/remd-caption`  |
> | Sätteri     | `@mirrordown/sat-caption`   |
> ~: One plugin per engine
>
% Code
> ````markdown
> | Engine      | Plugin                      |
> | ----------- | --------------------------- |
> | markdown-it | `@mirrordown/mdit-caption`  |
> | remark      | `@mirrordown/remd-caption`  |
> | Sätteri     | `@mirrordown/sat-caption`   |
> ~: One plugin per engine
> ````

A table reads the caption line as a row of its own, so a table's caption can't contain a `|` (write `\|`).

### Any other block

% Demo
> 1. Measure twice.
> 2. Cut once.
> ~: A carpenter's rule
>
% Code
> ````markdown
> 1. Measure twice.
> 2. Cut once.
> ~: A carpenter's rule
> ````

## Which block a caption goes on

A caption goes on the block it's written after, at the level its `>` markers and indentation put it, the same rule [attrs](/guide/plugins/attrs) uses for a line of attributes. Written inside a quote or list item, it captions the block before it there; written outside, it captions the quote or the whole list.

````markdown
> > A quote in a quote
> ~: Captions the inner quote
~: Captions the outer quote

- An item
  ~: Captions the item's paragraph
- Another item
~: Captions the list
````

The caption runs to the end of its paragraph, so a `~:` on a later line at the same level is part of it. A caption doesn't attach to a heading, a thematic break, raw HTML, or another caption, and a `~:` after a blank line is text, so a caption always touches its block.

### Attributes

With the [`attrs`](/guide/plugins/attrs) plugin, attributes written at the end of a caption go on the figure, which gives it an id to link to. A block keeps its own attributes.

% Demo
> ![Wild rice growing in a marsh](./assets/wild-rice.jpg){.photo}
> ~: Wild rice in late summer {#fig-rice}
>
% Code
> ````markdown
> ![Wild rice growing in a marsh](./assets/wild-rice.jpg){.photo}
> ~: Wild rice in late summer {#fig-rice}
> ````

```html
<figure class="markdown-caption" id="fig-rice">
  <img src="wild-rice.jpg" alt="Wild rice growing in a marsh" class="photo">
  <figcaption>Wild rice in late summer</figcaption>
</figure>
```

## Customization

The stylesheet keeps its rules in `@layer markdown-caption`, so any unlayered CSS you write overrides them. It removes the browser's default figure indent (40px on each side, which would narrow tables and code) and sets the caption a little smaller and lighter than the text around it.

```css
.markdown-caption > figcaption {
  font-style: italic;
  text-align: center;
}
```

Number figures with a CSS counter:

```css
.content {
  counter-reset: figure;
}

.markdown-caption > figcaption::before {
  counter-increment: figure;
  content: "Figure " counter(figure) ": ";
}
```

## Compared with remark-captions

[remark-captions](https://github.com/zestedesavoir/zmarkdown/tree/master/packages/remark-captions) uses a word for each kind of block (`Figure:`, `Source:`, `Code:`, `Table:`) and captions only the kinds it's configured for. This plugin has one marker for every block. Its table captions also work with today's GFM tables, where remark-captions' `Table:` line becomes a row.

## Usage

% Remark
> List it after remark-attrs (attributes ending a caption go on the figure) and the plugins that build container blocks (tabs, steps, alerts, definition lists). Caption lines are found by their place in the source, so the plugin needs the file's value, as `process` gives it.
>
> ```sh
> npm install @mirrordown/remd-caption
> ```
%% Unified
> ```ts
> import { unified } from "unified";
> import remarkParse from "remark-parse";
> import remarkRehype from "remark-rehype";
> import rehypeStringify from "rehype-stringify";
> import { remarkCaption } from "@mirrordown/remd-caption";
> import "@mirrordown/remd-caption/caption.css";
>
> const processor = unified()
>   .use(remarkParse)
>   .use(remarkCaption)
>   .use(remarkRehype)
>   .use(rehypeStringify);
> ```
%% Astro
> ```ts
> // astro.config.ts
> import { defineConfig } from "astro/config";
> import { remarkCaption } from "@mirrordown/remd-caption";
>
> export default defineConfig({
>   markdown: {
>     remarkPlugins: [remarkCaption],
>   },
> });
>
> // In your layout:
> import "@mirrordown/remd-caption/caption.css";
> ```
% Markdown-It
> ```sh
> npm install @mirrordown/mdit-caption
> ```
>
> Install it after the plugins that build container blocks (tabs, steps, alerts, definition lists).
%% Standalone
> ```ts
> import MarkdownIt from "markdown-it";
> import { caption } from "@mirrordown/mdit-caption";
> import "@mirrordown/mdit-caption/styles";
>
> const md = new MarkdownIt().use(caption);
> ```
%% VitePress
> ```ts
> // .vitepress/config.ts
> import { defineConfig } from "vitepress";
> import { caption } from "@mirrordown/mdit-caption";
> import "@mirrordown/mdit-caption/styles";
>
> export default defineConfig({
>   markdown: {
>     config: (md) => md.use(caption),
>   },
> });
> ```
% Sätteri
> ```sh
> npm install @mirrordown/sat-caption
> ```
>
> List it after the plugins that build container blocks (tabs, steps, alerts). Sätteri reads attributes itself, with its `attributes` feature.
%% Standalone
> ```ts
> import { markdownToHtml } from "satteri";
> import { satteriCaption } from "@mirrordown/sat-caption";
> import "@mirrordown/sat-caption/caption.css";
>
> const { html } = markdownToHtml(source, {
>   mdastPlugins: [satteriCaption()],
> });
> ```
%% Astro
> ```ts
> // astro.config.ts
> import { defineConfig } from "astro/config";
> import { satteri } from "@astrojs/markdown-satteri";
> import { satteriCaption } from "@mirrordown/sat-caption";
>
> export default defineConfig({
>   markdown: {
>     processor: satteri({ mdastPlugins: [satteriCaption()] }),
>   },
> });
>
> // In your layout:
> import "@mirrordown/sat-caption/caption.css";
> ```
