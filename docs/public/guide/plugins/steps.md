---
title: steps
description: Renders numbered step lists using @N. headers and > blockquote bodies.
---

<style>
  @import url("../../markdown.css");
</style>

## Overview

The `steps` plugin converts `@N.`-prefixed headers and `>`-prefixed blockquote bodies into styled ordered step lists. Depth is controlled by repeating the `@` character.

```html
<ol class="markdown-steps">
  <li class="markdown-steps-item" data-step="1">
    <p class="markdown-steps-title">Step title</p>
    <div class="markdown-steps-body">...</div>
  </li>
</ol>
```

## Syntax

Write `@1. Title` lines followed by `>` blockquote bodies for each step:

% Demo
> @1. Install dependencies
> > ```sh
> > npm install
> > ```
> @2. Configure your environment
> > Copy `.env.example` to `.env` and fill in your values.
> @3. Start the development server
> > ```sh
> > npm run dev
> > ```
>
% Code
> ````markdown
> @1. Install dependencies
> > ```sh
> > npm install
> > ```
> @2. Configure your environment
> > Copy `.env.example` to `.env` and fill in your values.
> @3. Start the development server
> > ```sh
> > npm run dev
> > ```
> ````

### Step titles are optional

Steps can have no title — just a body:

% Demo
> @1.
> > First thing to do.
> @2.
> > Second thing to do.
>
% Code
> ````markdown
> @1.
> > First thing to do.
> @2.
> > Second thing to do.
> ````

### Nested steps

Use `@@` to nest steps inside a parent step:

% Demo
> @1. Set up the project
> @@1. Create a new directory
> > ```sh
> > mkdir my-project && cd my-project
> > ```
> @@2. Initialize git
> > ```sh
> > git init
> > ```
> @2. Install dependencies
> > ```sh
> > npm install
> > ```
>
% Code
> ````markdown
> @1. Set up the project
> @@1. Create a new directory
> > ```sh
> > mkdir my-project && cd my-project
> > ```
> @@2. Initialize git
> > ```sh
> > git init
> > ```
> @2. Install dependencies
> > ```sh
> > npm install
> > ```
> ````

## Usage

% Remark
> Install `@mirrordown/remd-steps`. You must also pass `stepsHastHandlers` to `remarkRehype` and import the stylesheet:
>
> ```sh
> npm install @mirrordown/remd-steps
> ```
%% Unified
> ```ts
> import { unified } from "unified";
> import remarkParse from "remark-parse";
> import remarkRehype from "remark-rehype";
> import rehypeStringify from "rehype-stringify";
> import { remarkSteps, stepsHastHandlers } from "@mirrordown/remd-steps";
> import "@mirrordown/remd-steps/steps.css";
>
> const processor = unified()
>   .use(remarkParse)
>   .use(remarkSteps)
>   .use(remarkRehype, { handlers: stepsHastHandlers })
>   .use(rehypeStringify);
> ```
%% Astro
> ```ts
> // astro.config.ts
> import { defineConfig } from "astro/config";
> import { remarkSteps, stepsHastHandlers } from "@mirrordown/remd-steps";
> import "@mirrordown/remd-steps/steps.css";
>
> export default defineConfig({
>   markdown: {
>     remarkPlugins: [remarkSteps],
>     remarkRehype: { handlers: stepsHastHandlers },
>   },
> });
> ```
% Markdown-It
> ```sh
> npm install @mirrordown/mdit-steps
> ```
%% Standalone
> ```ts
> import MarkdownIt from "markdown-it";
> import { steps } from "@mirrordown/mdit-steps";
> import "@mirrordown/mdit-steps/steps.css";
>
> const md = new MarkdownIt().use(steps);
> ```
%% VitePress
> ```ts
> // .vitepress/config.ts
> import { defineConfig } from "vitepress";
> import { steps } from "@mirrordown/mdit-steps";
> import "@mirrordown/mdit-steps/steps.css";
>
> export default defineConfig({
>   markdown: {
>     config: (md) => md.use(steps),
>   },
> });
> ```
% Sätteri
> ```sh
> npm install @mirrordown/sat-steps
> ```
%% Standalone
> ```ts
> import { markdownToHtml } from "satteri";
> import { satteriSteps } from "@mirrordown/sat-steps";
> import "@mirrordown/sat-steps/steps.css";
>
> const { html } = markdownToHtml(source, {
>   mdastPlugins: [satteriSteps()],
> });
> ```
%% Astro
> ```ts
> // astro.config.ts
> import { defineConfig } from "astro/config";
> import { satteri } from "@astrojs/markdown-satteri";
> import { satteriSteps } from "@mirrordown/sat-steps";
>
> export default defineConfig({
>   markdown: {
>     processor: satteri({ mdastPlugins: [satteriSteps()] }),
>   },
> });
>
> // In your layout:
> import "@mirrordown/sat-steps/steps.css";
> ```
