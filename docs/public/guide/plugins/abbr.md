---
title: abbr
description: Adds abbreviation definitions that auto-expand matching text with tooltips.
---

<style>
  @import url("../../markdown.css");
</style>

## Overview

The `abbr` plugin lets you define abbreviations once and automatically wraps every occurrence in an `<abbr>` element with a `title` attribute for the full expansion.

```html
<abbr title="HyperText Markup Language">HTML</abbr>
```

## Syntax

Define abbreviations anywhere in the document using the `*[ABBR]: Full text` syntax. Definitions are removed from the output and all matching words are wrapped automatically.

% Demo
> *[HTML]: HyperText Markup Language
> *[CSS]: Cascading Style Sheets
>
> Write HTML and CSS as normal — they are automatically expanded with tooltips.
% Code
> ````markdown
> *[HTML]: HyperText Markup Language
> *[CSS]: Cascading Style Sheets
>
> Write HTML and CSS as normal — they are automatically expanded with tooltips.
> ````

Write definitions in a paragraph of their own, one per line, with a blank line before and after. A definition can come after the places that use its term, and the first definition of a term wins.

The title is the rest of the line exactly as written: formatting, character references and backslashes in it are not read. The space around the term and around the title is dropped, and a line that leaves either one blank is ordinary text. A backslash puts a bracket in a term (`*[a\]b]: …`), and a backslash before the asterisk (`\*[HTML]: …`) keeps the whole line as text.

A term is marked where it stands as a word of its own: with the start or end of the text, a space, a line ending, punctuation, or one of `$ + < = > ^ | ~` and the backtick on each side. So `HTML` is marked in `(HTML)`, `HTML-5` and `foo_HTML`, and not in `HTML5`, `HTMLé` or `HTML™`. A term can start or end with any character (`C++`, `.NET`, `日本`), terms are case-sensitive, and where two terms start at the same place the longer one wins. Code and image alt text are left alone.

A few things differ between the engines:

- markdown-it also takes a definition line written directly against other text, with no blank line between them. remark and Sätteri show that line as text.
- markdown-it takes its list of punctuation characters from its own tables, and remark and Sätteri take theirs from the JavaScript runtime, so a punctuation character added to Unicode recently can end a word in one and not in the other.
- The remark plugin reads definitions from the source, so it needs the file: with `processor.runSync(tree)` on a tree alone it reads each paragraph's text instead, where a title holding formatting is not a definition.

## Usage

% Remark
> ```sh
> npm install @mirrordown/remd-abbr
> ```
%% Unified
> ```ts
> import { unified } from "unified";
> import remarkParse from "remark-parse";
> import remarkRehype from "remark-rehype";
> import rehypeStringify from "rehype-stringify";
> import { remarkAbbr } from "@mirrordown/remd-abbr";
>
> const processor = unified()
>   .use(remarkParse)
>   .use(remarkAbbr)
>   .use(remarkRehype)
>   .use(rehypeStringify);
> ```
%% Astro
> ```ts
> // astro.config.ts
> import { defineConfig } from "astro/config";
> import { remarkAbbr } from "@mirrordown/remd-abbr";
>
> export default defineConfig({
>   markdown: {
>     remarkPlugins: [remarkAbbr],
>   },
> });
> ```
% Markdown-It
> ```sh
> npm install @mirrordown/mdit-abbr
> ```
%% Standalone
> ```ts
> import MarkdownIt from "markdown-it";
> import { abbr } from "@mirrordown/mdit-abbr";
>
> const md = new MarkdownIt().use(abbr);
> ```
%% VitePress
> ```ts
> // .vitepress/config.ts
> import { defineConfig } from "vitepress";
> import { abbr } from "@mirrordown/mdit-abbr";
>
> export default defineConfig({
>   markdown: {
>     config: (md) => md.use(abbr),
>   },
> });
> ```
% Sätteri
> ```sh
> npm install @mirrordown/sat-abbr
> ```
%% Standalone
> ```ts
> import { markdownToHtml } from "satteri";
> import { satteriAbbr } from "@mirrordown/sat-abbr";
>
> const { html } = markdownToHtml(source, {
>   mdastPlugins: [satteriAbbr()],
> });
> ```
%% Astro
> ```ts
> // astro.config.ts
> import { defineConfig } from "astro/config";
> import { satteri } from "@astrojs/markdown-satteri";
> import { satteriAbbr } from "@mirrordown/sat-abbr";
>
> export default defineConfig({
>   markdown: {
>     processor: satteri({ mdastPlugins: [satteriAbbr()] }),
>   },
> });
> ```
