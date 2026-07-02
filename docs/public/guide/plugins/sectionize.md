---
title: sectionize
description: Wraps each heading and the content beneath it in a semantic <section> element, nesting by heading depth.
---

<style>
  @import url("../../markdown.css");
</style>

## Overview

The `sectionize` plugin wraps every heading — together with all the content that follows it, up to the next heading of equal or shallower depth — in a semantic `<section>` element. Deeper headings nest inside the sections of their shallower ancestors, mirroring the document outline. Each section carries a `data-depth` attribute equal to the rank of its heading (`1`–`6`), so sections can be targeted with CSS or scripting.

Content that appears before the first heading stays unwrapped.

**Before:**
```html
<h2>Install</h2>
<p>Run the installer.</p>
<h3>Requirements</h3>
<p>Node 24+.</p>
```

**After:**
```html
<section data-depth="2">
  <h2>Install</h2>
  <p>Run the installer.</p>
  <section data-depth="3">
    <h3>Requirements</h3>
    <p>Node 24+.</p>
  </section>
</section>
```

## Syntax

There is no special syntax — write ordinary headings and the plugin builds the section structure from the heading outline:

% Demo
> # Getting Started
>
> Some introduction text.
>
> ## Installation
>
> Steps to install.
>
> ## Configuration
>
> How to configure it.
% Code
> ````markdown
> # Getting Started
>
> Some introduction text.
>
> ## Installation
>
> Steps to install.
>
> ## Configuration
>
> How to configure it.
> ````

Skipped heading levels are handled gracefully: an `<h3>` directly under an `<h1>` nests as `data-depth="3"` inside the `<h1>`'s section, with no intervening `<h2>` section invented.

> [!TIP]
> `sectionize` only wraps — it never touches heading ids. Run it **before** `slug`/`autolink-headings` so those plugins still add ids to the (now nested) headings.

## Usage

> [!NOTE]
> This is a rehype plugin (`rehype-*`), not a remark plugin. Add it **after** `remarkRehype` in your pipeline.

% Rehype
> ```sh
> npm install @mirrordown/remd-sectionize
> ```
%% Unified
> ```ts
> import { unified } from "unified";
> import remarkParse from "remark-parse";
> import remarkRehype from "remark-rehype";
> import rehypeStringify from "rehype-stringify";
> import { rehypeSectionize } from "@mirrordown/remd-sectionize";
>
> const processor = unified()
>   .use(remarkParse)
>   .use(remarkRehype)
>   .use(rehypeSectionize)
>   .use(rehypeStringify);
> ```
%% Astro
> ```ts
> // astro.config.ts
> import { defineConfig } from "astro/config";
> import { rehypeSectionize } from "@mirrordown/remd-sectionize";
>
> export default defineConfig({
>   markdown: {
>     rehypePlugins: [rehypeSectionize],
>   },
> });
> ```
%% VitePress
> ```ts
> // .vitepress/config.ts
> import { defineConfig } from "vitepress";
> import { rehypeSectionize } from "@mirrordown/remd-sectionize";
>
> export default defineConfig({
>   markdown: {
>     rehypePlugins: [rehypeSectionize],
>   },
> });
> ```
% Markdown-It
> ```sh
> npm install @mirrordown/mdit-sectionize
> ```
%% Standalone
> ```ts
> import MarkdownIt from "markdown-it";
> import { sectionize } from "@mirrordown/mdit-sectionize";
>
> const md = new MarkdownIt().use(sectionize);
> ```
%% VitePress
> ```ts
> // .vitepress/config.ts
> import { defineConfig } from "vitepress";
> import { sectionize } from "@mirrordown/mdit-sectionize";
>
> export default defineConfig({
>   markdown: {
>     config: (md) => md.use(sectionize),
>   },
> });
> ```
