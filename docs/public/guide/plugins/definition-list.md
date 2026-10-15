---
title: definition-list
description: "Adds definition list syntax using terms followed by : or ~ descriptions."
---

<style>
  @import url("../../markdown.css");
</style>

## Overview

The `definition-list` plugin renders Pandoc-style definition lists as HTML `<dl>`, `<dt>`, and `<dd>` elements.

```html
<dl>
  <dt>Term</dt>
  <dd>Definition</dd>
</dl>
```

## Syntax

Write a term on one line, then follow it with one or more definitions prefixed by `: ` or `~ `:

% Demo
> Apple
> : A round fruit with red or green skin.
> : Also a technology company.
>
> Orange
> : A citrus fruit with orange skin.
% Code
> ````markdown
> Apple
> : A round fruit with red or green skin.
> : Also a technology company.
>
> Orange
> : A citrus fruit with orange skin.
> ````

A term fits on one line: a marker after a paragraph of two or more lines continues that paragraph instead of starting a list, as in Pandoc.

Each definition is tight or loose on its own. A definition is loose, and wraps its content in `<p>`, when a blank line comes directly before its marker or separates blocks inside it. Otherwise its paragraphs render unwrapped. A marker with nothing after it produces an empty `<dd>`.

### Styling

The plugin ships no stylesheet: `<dl>`, `<dt>` and `<dd>` get the browser's defaults, which indent each definition and leave its term plain. The examples in the Mirrordown docs use the docs' own styles, which bold the term and set each definition off with a rule:

```css
dt {
  font-weight: 600;
}

dd {
  margin-inline-start: 0.25rem;
  padding-inline-start: 1rem;
  border-inline-start: 2px solid #e5e7eb;
}
```

## Usage

% Remark
> Install `@mirrordown/remd-definition-list`. You must also pass `defListHastHandlers` to `remarkRehype` so the custom AST nodes are converted to HTML correctly:
>
> ```sh
> npm install @mirrordown/remd-definition-list
> ```
%% Unified
> ```ts
> import { unified } from "unified";
> import remarkParse from "remark-parse";
> import remarkRehype from "remark-rehype";
> import rehypeStringify from "rehype-stringify";
> import { remarkDefinitionList, defListHastHandlers } from "@mirrordown/remd-definition-list";
>
> const processor = unified()
>   .use(remarkParse)
>   .use(remarkDefinitionList)
>   .use(remarkRehype, { handlers: defListHastHandlers })
>   .use(rehypeStringify);
> ```
%% Astro
> ```ts
> // astro.config.ts
> import { defineConfig } from "astro/config";
> import { remarkDefinitionList, defListHastHandlers } from "@mirrordown/remd-definition-list";
>
> export default defineConfig({
>   markdown: {
>     remarkPlugins: [remarkDefinitionList],
>     remarkRehype: { handlers: defListHastHandlers },
>   },
> });
> ```
% Markdown-It
> ```sh
> npm install @mirrordown/mdit-definition-list
> ```
%% Standalone
> ```ts
> import MarkdownIt from "markdown-it";
> import { definitionList } from "@mirrordown/mdit-definition-list";
>
> const md = new MarkdownIt().use(definitionList);
> ```
%% VitePress
> ```ts
> // .vitepress/config.ts
> import { defineConfig } from "vitepress";
> import { definitionList } from "@mirrordown/mdit-definition-list";
>
> export default defineConfig({
>   markdown: {
>     config: (md) => md.use(definitionList),
>   },
> });
> ```
