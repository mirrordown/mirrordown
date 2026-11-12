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

### Things to know

- Steps are numbered in the order they are written: the number in `@N.` is not read, so `@1.` on every step, or `@3.` after `@1.`, renders 1, 2, 3.
- A blank line inside a body needs the body's `>`. Written without it, the blank line ends the blocks before it (a list or a code fence does not continue across it), though the body itself goes on with the next `>` line.
- A line that is neither a header nor a `>` line ends the steps. In a list item, write headers at the indentation of the item's content: a line written short of it continues the paragraph before it as text, as it does in CommonMark, whether it is a header or not.
- In a blockquote, a line written without any `>` leaves the blockquote. Between two steps, markdown-it ends the blockquote at that line and starts another for the steps after it, while remark and Sätteri keep the line and those steps in the one blockquote.
- With the tabs plugin, leave a blank line between a tab group and a step header after it: directly under the last panel, the header starts steps in markdown-it and stays text in remark and Sätteri.
- A `>` indented four columns or more is not a body's marker, as it is no blockquote's in CommonMark: the line continues the paragraph before it as text (directly after a header, that ends the steps), and after a blank line it is indented code.
- An alert in a step's body is written as a nested quote (`> > [!NOTE]`). After a blank line, a quote that starts with an alert marker at the body's own level (`> [!NOTE]`) is an alert of its own and ends the steps. Directly under a header, that same line is the first line of the body in markdown-it, while remark and Sätteri with the alerts plugin render the alert after the steps.
- A backslash before the `@` (`\@1.`) writes the line as text.
- `remarkSteps` reads each line's `>` markers from the file's source, so it needs a tree parsed from that same file with positions, as `remark-parse` produces. On a tree built another way, a header or the end of the steps that depends on those markers is not recognized.

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
