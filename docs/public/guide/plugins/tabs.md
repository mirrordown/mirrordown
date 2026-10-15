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
