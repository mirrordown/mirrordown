---
title: copy-code
description: "Adds a copy button to every code block, as an invoker command, with a small client script that copies."
---

<style>
  @import url("../../markdown.css");
</style>

## Overview

The `copy-code` plugin adds a copy button to every code block. The button goes in the block's `<pre>`, after its `<code>`, with no wrapper element. It's an [invoker command](https://developer.mozilla.org/docs/Web/API/Invoker_Commands_API) aimed at the `<pre>`, which takes an id from a hash of the code:

```html
<pre id="code-mxxtmr"><code class="language-sh">npm install @mirrordown/remd-copy-code
</code><button type="button" class="markdown-copy-code" command="--copy" commandfor="code-mxxtmr" aria-label="Copy code" hidden>
  <svg data-icon="copy">...</svg>
  <svg data-icon="check">...</svg>
</button></pre>
```

Copying needs JavaScript: no browser copies to the clipboard from markup alone. So each package ships a small client script that handles the `--copy` command, and the buttons render `hidden` until it runs. A page without the script, or a browser without invoker commands or the clipboard, shows no button rather than one that does nothing.

## Syntax

There's nothing to write: every fenced and indented code block gets a button. Hover a block to see it, or tab to it.

% Demo
> ```sh
> npm install @mirrordown/remd-copy-code
> ```
>
% Code
> ````markdown
> ```sh
> npm install @mirrordown/remd-copy-code
> ```
> ````

A block's id comes from a hash of its code, so it doesn't change when other blocks are edited. Repeated blocks get `-2`, `-3` and so on, in document order.

### Turning it off for a block

Write `nocopy` after the fence's language to leave a block without a button, for output or code that isn't meant to be run as is:

% Demo
> ```sh nocopy
> $ npm test
> ✓ 42 tests passed
> ```
>
% Code
> ````markdown
> ```sh nocopy
> $ npm test
> ✓ 42 tests passed
> ```
> ````

A block that another plugin renders as something else, such as a [mermaid diagram](/guide/plugins/mermaid-pele), gets no button either.

A host that highlights code before your plugins run, such as Astro with Shiki, rebuilds each block from its code and language and drops the fence's meta. The plugin also reads the meta from a `data-meta` attribute on the `<pre>`, so keep it there with a Shiki transformer:

```ts
// astro.config.ts
export default defineConfig({
  markdown: {
    shikiConfig: {
      transformers: [
        {
          pre(node) {
            const meta = this.options.meta?.__raw;
            if (meta) node.properties.dataMeta = meta;
          },
        },
      ],
    },
  },
});
```

## The client script

Import the script once per page, from the package for your engine. It does three things:

- **Shows the buttons.** It adopts a small stylesheet into the document, so buttons on pages that client-side navigation swaps in, such as Astro's view transitions, show too.
- **Copies.** It handles the `--copy` command by copying the text of the block's `<code>`, without the newline markdown ends a block with.
- **Says so.** The button shows a check and is labeled "Copied" for two seconds, and a polite live region tells screen readers the code was copied.

```ts
import "@mirrordown/remd-copy-code/client";
```

## Accessibility

The button is a real `<button>`, labeled "Copy code", so it's reachable by keyboard and named for screen readers. Its icons are `aria-hidden`. The button is hidden until the script can copy, so assistive technology never meets a control that does nothing.

## Customization

The stylesheet keeps its rules in `@layer markdown-copy-code`, so any unlayered CSS you write overrides them. Where [CSS anchor positioning](https://developer.mozilla.org/docs/Web/CSS/CSS_anchor_positioning) with `anchor-scope` is supported, the button sits in the block's top corner, anchored to the `<pre>` itself, so it stays put while a long line scrolls. On devices that hover, it shows while the block is hovered or the button focused. Elsewhere it sits at the end of the block.

The button takes its colors from the block, so it suits any code theme: the block's text color, and its background under a tint of that color. Change the tint and the border with custom properties on the button or any ancestor:

```css
.content {
  --markdown-copy-code-tint: oklch(0.6 0.15 250 / 0.2);
  --markdown-copy-code-border: oklch(0.6 0.15 250 / 0.5);
}
```

## VS Code

There's no VS Code extension for this plugin: VS Code's Markdown preview has had its own copy button on code blocks since version 1.132.

## Usage

% Remark
> The remark package ships `rehypeCopyCode`, a rehype plugin: register it after `remark-rehype`, and after plugins that replace code blocks, such as mermaid-pele. It adds each button as a `raw` node, so it reaches the HTML exactly as the other engines write it; stringify with `allowDangerousHtml: true` (Astro already does).
>
> ```sh
> npm install @mirrordown/remd-copy-code
> ```
%% Unified
> ```ts
> import { unified } from "unified";
> import remarkParse from "remark-parse";
> import remarkRehype from "remark-rehype";
> import rehypeStringify from "rehype-stringify";
> import { rehypeCopyCode } from "@mirrordown/remd-copy-code";
>
> const processor = unified()
>   .use(remarkParse)
>   .use(remarkRehype)
>   .use(rehypeCopyCode)
>   .use(rehypeStringify, { allowDangerousHtml: true });
>
> // In the page:
> import "@mirrordown/remd-copy-code/copy-code.css";
> import "@mirrordown/remd-copy-code/client";
> ```
%% Astro
> ```ts
> // astro.config.ts
> import { defineConfig } from "astro/config";
> import { rehypeCopyCode } from "@mirrordown/remd-copy-code";
>
> export default defineConfig({
>   markdown: {
>     rehypePlugins: [rehypeCopyCode],
>   },
> });
> ```
>
> ```astro
> ---
> // In your layout:
> import "@mirrordown/remd-copy-code/copy-code.css";
> ---
>
> <script>
>   import "@mirrordown/remd-copy-code/client";
> </script>
> ```
% Markdown-It
> ```sh
> npm install @mirrordown/mdit-copy-code
> ```
%% Standalone
> ```ts
> import MarkdownIt from "markdown-it";
> import { copyCode } from "@mirrordown/mdit-copy-code";
>
> const md = new MarkdownIt().use(copyCode);
>
> // In the page:
> import "@mirrordown/mdit-copy-code/styles";
> import "@mirrordown/mdit-copy-code/client";
> ```
%% VitePress
> VitePress has its own copy button on code blocks, so you don't need this plugin there.
% Sätteri
> ```sh
> npm install @mirrordown/sat-copy-code
> ```
>
> List it after plugins that replace code blocks, such as mermaid-pele.
%% Standalone
> ```ts
> import { markdownToHtml } from "satteri";
> import { satteriCopyCode } from "@mirrordown/sat-copy-code";
>
> const { html } = markdownToHtml(source, {
>   hastPlugins: [satteriCopyCode()],
> });
>
> // In the page:
> import "@mirrordown/sat-copy-code/copy-code.css";
> import "@mirrordown/sat-copy-code/client";
> ```
%% Astro
> ```ts
> // astro.config.ts
> import { defineConfig } from "astro/config";
> import { satteri } from "@astrojs/markdown-satteri";
> import { satteriCopyCode } from "@mirrordown/sat-copy-code";
>
> export default defineConfig({
>   markdown: {
>     processor: satteri({ hastPlugins: [satteriCopyCode()] }),
>   },
> });
> ```
>
> ```astro
> ---
> // In your layout:
> import "@mirrordown/sat-copy-code/copy-code.css";
> ---
>
> <script>
>   import "@mirrordown/sat-copy-code/client";
> </script>
> ```
