---
title: del
description: Adds strikethrough/delete syntax using --double dashes--.
---

<style>
  @import url("../../../src/styles/markdown.css");
</style>

## Overview

The `del` plugin renders `--text--` as an HTML `<del>` element, representing deleted or struck-through text.

```html
<del>text</del>
```

## Syntax

Wrap text in double dashes to mark it as deleted:

--This text has been deleted.--

You can use it inline: the price was --$50-- $35.

## Usage

% remd

> Install `@saeris/remd-del` and add it to your remark pipeline:
>
> ```sh
> npm install @saeris/remd-del
> ```
>
> ```ts
> import { unified } from "unified";
> import remarkParse from "remark-parse";
> import remarkRehype from "remark-rehype";
> import rehypeStringify from "rehype-stringify";
> import { remarkDel } from "@saeris/remd-del";
>
> const processor = unified()
>   .use(remarkParse)
>   .use(remarkDel)
>   .use(remarkRehype)
>   .use(rehypeStringify);
> ```

% mdit

> Install `@saeris/mdit-del` and register it with your markdown-it instance:
>
> ```sh
> npm install @saeris/mdit-del
> ```
>
> ```ts
> import MarkdownIt from "markdown-it";
> import { del } from "@saeris/mdit-del";
>
> const md = new MarkdownIt().use(del);
> ```
