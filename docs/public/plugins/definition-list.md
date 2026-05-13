---
title: definition-list
description: "Adds definition list syntax using terms followed by : or ~ descriptions."
---

<style>
  @import url("../markdown.css");
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

Apple
: A round fruit with red or green skin.
: Also a technology company.

Orange
: A citrus fruit with orange skin.

Multiple terms can share definitions:

HTTP
HTTPS
: Protocols for transferring data on the web.

## Usage

% Remark
> Install `@saeris/remd-definition-list`. You must also pass `defListHastHandlers` to `remarkRehype` so the custom AST nodes are converted to HTML correctly:
>
> ```sh
> npm install @saeris/remd-definition-list
> ```
%% Unified
> ```ts
> import { unified } from "unified";
> import remarkParse from "remark-parse";
> import remarkRehype from "remark-rehype";
> import rehypeStringify from "rehype-stringify";
> import { remarkDefinitionList, defListHastHandlers } from "@saeris/remd-definition-list";
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
> import { remarkDefinitionList, defListHastHandlers } from "@saeris/remd-definition-list";
>
> export default defineConfig({
>   markdown: {
>     remarkPlugins: [remarkDefinitionList],
>     remarkRehype: { handlers: defListHastHandlers },
>   },
> });
> ```
%% VitePress
> ```ts
> // .vitepress/config.ts
> import { defineConfig } from "vitepress";
> import { remarkDefinitionList, defListHastHandlers } from "@saeris/remd-definition-list";
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
> npm install @saeris/mdit-definition-list
> ```
%% Standalone
> ```ts
> import MarkdownIt from "markdown-it";
> import { definitionList } from "@saeris/mdit-definition-list";
>
> const md = new MarkdownIt().use(definitionList);
> ```
%% VitePress
> ```ts
> // .vitepress/config.ts
> import { defineConfig } from "vitepress";
> import { definitionList } from "@saeris/mdit-definition-list";
>
> export default defineConfig({
>   markdown: {
>     config: (md) => md.use(definitionList),
>   },
> });
> ```
