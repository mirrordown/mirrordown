---
title: tabs
description: Renders CSS-only tab groups using % tab headers and > blockquote bodies.
---

<style>
  @import url("../../markdown.css");
</style>

## Overview

The `tabs` plugin converts `%`-prefixed headers and `>`-prefixed blockquote bodies into CSS-only tab groups. Tabs use hidden radio inputs for state — no JavaScript required.

```html
<div class="markdown-tabs" data-tabs-group="...">
  <div class="markdown-tabs-labels">...</div>
  <div class="markdown-tabs-panels">...</div>
</div>
```

## Syntax

Write a `% Label` line followed by a `>` blockquote for each tab's content:

% Demo
> % JavaScript
> > ```js
> > console.log("Hello, world!");
> > ```
> % TypeScript
> > ```ts
> > const greeting: string = "Hello, world!";
> > console.log(greeting);
> > ```
> % Python
> > ```py
> > print("Hello, world!")
> > ```
% Code
> ````markdown
> % JavaScript
> > ```js
> > console.log("Hello, world!");
> > ```
> % TypeScript
> > ```ts
> > const greeting: string = "Hello, world!";
> > console.log(greeting);
> > ```
> % Python
> > ```py
> > print("Hello, world!")
> > ```
> ````

### Default open tab

Mark a tab with `%+` to make it open by default (the first tab is open by default otherwise):

% Demo
> % Option A
> > This tab is not selected by default.
> %+ Option B
> > This tab opens by default.
> % Option C
> > This tab is not selected by default.
% Code
> ````markdown
> % Option A
> > This tab is not selected by default.
> %+ Option B
> > This tab opens by default.
> % Option C
> > This tab is not selected by default.
> ````

### Nested tabs

Use `%%` for a second level of nesting inside a tab:

% Demo
> % Frontend
> %% React
> > ```tsx
> > export function App() {
> >   return <h1>Hello</h1>;
> > }
> > ```
> %% Vue
> > ```vue
> > <template><h1>Hello</h1></template>
> > ```
> % Backend
> > Node.js or any server runtime.
% Code
> ````markdown
> % Frontend
> %% React
> > ```tsx
> > export function App() {
> >   return <h1>Hello</h1>;
> > }
> > ```
> %% Vue
> > ```vue
> > <template><h1>Hello</h1></template>
> > ```
> % Backend
> > Node.js or any server runtime.
> ````

### Things to know

- Every line of a panel starts with `>`. A line that is neither a header nor a `>` line ends the tabs, and so does a blank line at the top level of the document.
- A blank line inside a panel needs the panel's `>`. Inside another block (a blockquote, a list item, a step), a blank line written without it ends the blocks before it (a list or a code fence does not continue across it), though the panel itself goes on with the next `>` line.
- A header is one line. Spaces at its end are not part of the label and make no line break, and a backslash at its end is a literal backslash.
- In a list item, write a blank line before the first header if text comes before it: without one, markdown-it starts the tabs there and remark and Sätteri leave the line as text. Don't underline a header with `===` or `---`: remark and Sätteri read that as CommonMark does (a heading), markdown-it as tabs.
- A `>` indented four columns or more is not a panel's marker, as it is no blockquote's in CommonMark: the line continues the paragraph before it as text (directly after a header, that ends the tabs), and after a blank line it is indented code.
- A group's ids (the `name` and `id` of its inputs, the `for` of its labels) are unique per document, not per page. They are built from the group's labels and its place among the document's groups, so two documents rendered into one page repeat them where the same labels appear in the same place.
- The stylesheet targets the default container class, `markdown-tabs`. With another `containerClass` the tabs are yours to style, and the tab-icons plugin needs the same value.
- `remarkTabs` reads each line's `>` markers from the file's source, so it needs a tree parsed from that same file with positions, as `remark-parse` produces.

## Usage

% Remark
> Install `@mirrordown/remd-tabs`. You must also pass `tabsHastHandlers` to `remarkRehype` and import the stylesheet:
>
> ```sh
> npm install @mirrordown/remd-tabs
> ```
%% Unified
> ```ts
> import { unified } from "unified";
> import remarkParse from "remark-parse";
> import remarkRehype from "remark-rehype";
> import rehypeStringify from "rehype-stringify";
> import { remarkTabs, tabsHastHandlers } from "@mirrordown/remd-tabs";
> import "@mirrordown/remd-tabs/tabs.css";
>
> const processor = unified()
>   .use(remarkParse)
>   .use(remarkTabs)
>   .use(remarkRehype, { handlers: tabsHastHandlers })
>   .use(rehypeStringify);
> ```
%% Astro
> ```ts
> // astro.config.ts
> import { defineConfig } from "astro/config";
> import { remarkTabs, tabsHastHandlers } from "@mirrordown/remd-tabs";
> import "@mirrordown/remd-tabs/tabs.css";
>
> export default defineConfig({
>   markdown: {
>     remarkPlugins: [remarkTabs],
>     remarkRehype: { handlers: tabsHastHandlers },
>   },
> });
> ```
% Markdown-It
> ```sh
> npm install @mirrordown/mdit-tabs
> ```
%% Standalone
> ```ts
> import MarkdownIt from "markdown-it";
> import { tabs } from "@mirrordown/mdit-tabs";
> import "@mirrordown/mdit-tabs/tabs.css";
>
> const md = new MarkdownIt().use(tabs);
> ```
%% VitePress
> ```ts
> // .vitepress/config.ts
> import { defineConfig } from "vitepress";
> import { tabs } from "@mirrordown/mdit-tabs";
> import "@mirrordown/mdit-tabs/tabs.css";
>
> export default defineConfig({
>   markdown: {
>     config: (md) => md.use(tabs),
>   },
> });
> ```
% Sätteri
> Install `@mirrordown/sat-tabs` and import the stylesheet. List it after the plugins for inline syntax (mark, kbd and so on), so a panel's `aria-label` reads the label's text rather than its markup:
>
> ```sh
> npm install @mirrordown/sat-tabs
> ```
%% Standalone
> ```ts
> import { markdownToHtml } from "satteri";
> import { satteriTabs } from "@mirrordown/sat-tabs";
> import "@mirrordown/sat-tabs/tabs.css";
>
> const { html } = markdownToHtml(source, {
>   mdastPlugins: [satteriTabs()],
> });
> ```
%% Astro
> ```ts
> // astro.config.ts
> import { defineConfig } from "astro/config";
> import { satteri } from "@astrojs/markdown-satteri";
> import { satteriTabs } from "@mirrordown/sat-tabs";
>
> export default defineConfig({
>   markdown: {
>     processor: satteri({ mdastPlugins: [satteriTabs()] }),
>   },
> });
>
> // In your layout:
> import "@mirrordown/sat-tabs/tabs.css";
> ```
