# @mirrordown/sat-copy-code

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified, markdown-it and Sätteri ecosystems.

A Sätteri plugin for the `copy-code` syntax extension.

## Overview

The `copy-code` plugin adds a copy button to every code block. The button goes in the block's `<pre>`, after its `<code>`, with no wrapper element. It's an [invoker command](https://developer.mozilla.org/docs/Web/API/Invoker_Commands_API) aimed at the `<pre>`, which takes an id from a hash of the code:

```html
<pre id="code-mxxtmr"><code class="language-sh">npm install @mirrordown/remd-copy-code
</code><button type="button" class="markdown-copy-code" command="--copy" commandfor="code-mxxtmr" aria-label="Copy code" hidden>
  <span class="markdown-copy-code-icon" data-state="copy" aria-hidden="true"><svg>...</svg></span>
  <span class="markdown-copy-code-icon" data-state="copied" aria-hidden="true"><svg>...</svg></span>
  <span class="markdown-copy-code-text" data-state="copied" aria-hidden="true">Copied!</span>
</button></pre>
```

Copying needs JavaScript: no browser copies to the clipboard from markup alone. So each package ships a small client script that handles the `--copy` command, and the buttons render `hidden` until it runs. A page without the script, or a browser without invoker commands or the clipboard, shows no button rather than one that does nothing.

## Syntax

There's nothing to write: every fenced and indented code block gets a button. Hover a block to see it, or tab to it.

````markdown
```sh
npm install @mirrordown/remd-copy-code
```
````

A block's id comes from a hash of its code, so it doesn't change when other blocks are edited. Repeated blocks get `-2`, `-3` and so on, in document order.

### Turning it off for a block

Write `nocopy` after the fence's language to leave a block without a button, for output or code that isn't meant to be run as is:

````markdown
```sh nocopy
$ npm test
✓ 42 tests passed
```
````

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
- **Says so.** For two seconds, as GitHub's button does, it shows a check with its copied text beside it, "Copied!" by default, and takes that text as its label. A polite live region reads the text to screen readers.

```ts
import "@mirrordown/remd-copy-code/client";
```

## Configuration

All options are passed when registering the plugin, or as the presets' `copyCode` option.

### Icons

`icons` replaces the button's icon in either state with your own SVG markup: `copy` before the block is copied, `copied` after. The stylesheet sizes it to `1rem` and colors it with `currentColor`. An icon can be replaced but not removed, since it's all the button holds, so an empty one keeps the default. The defaults are Lucide's copy and check icons, exported as `COPY_CODE_ICONS`.

```ts
satteriCopyCode({ icons: { copied: `<svg viewBox="0 0 16 16">...</svg>` } })
```

### Text

`text` sets the text shown beside the button in each state. The `copied` text, "Copied!" by default, shows once the block is copied. A `copy` text, none by default, shows while the button is hovered or focused. Either one also names the button while it shows, so set them in your page's language. `null` or an empty string shows no text in that state.

```ts
satteriCopyCode({ text: { copy: "Copy", copied: "Copied" } })
```

## Accessibility

The button is a real `<button>`, so it's reachable by keyboard and named for screen readers. It's labeled "Copy code", or by its copy text when it has one, so the text a reader sees is the button's name. Its icons and text are `aria-hidden`, since the label already says what they show. The button is hidden until the script can copy, so assistive technology never meets a control that does nothing.

## Customization

The stylesheet keeps its rules in `@layer markdown-copy-code`, so any unlayered CSS you write overrides them. Where [CSS anchor positioning](https://developer.mozilla.org/docs/Web/CSS/CSS_anchor_positioning) with `anchor-scope` is supported, the button sits in the block's top corner, anchored to the `<pre>` itself, so it stays put while a long line scrolls. On devices that hover, it shows while the block is hovered or the button focused. Elsewhere it sits at the end of the block.

Its states follow GitHub's. At rest it's a muted icon on the block's background. Hovered, a tint of the block's text color fades in. Once copied, the icon turns into a green check and the text shows in a pill beside it. The pill is dark with white text, as GitHub's is, in a lighter gray where the page's [`color-scheme`](https://developer.mozilla.org/docs/Web/CSS/color-scheme) is dark, with a faint ring that sets it off a block of the same shade. The button itself takes its colors from the block, so it suits any code theme. Change the hover tint and the green with custom properties on the button or any ancestor:

```css
.content {
  --markdown-copy-code-tint: oklch(0.6 0.15 250 / 0.2);
  --markdown-copy-code-success: oklch(0.6 0.15 250);
}
```

To color the pill yourself, set `background-color` and `color` on `.markdown-copy-code-text`. A page that sets no `color-scheme` gets the light page's pill.

## VS Code

There's no VS Code extension for this plugin: VS Code's Markdown preview has had its own copy button on code blocks since version 1.132.

## Install

```sh
npm install @mirrordown/sat-copy-code
```

List it after plugins that replace code blocks, such as mermaid-pele.

### Standalone

```ts
import { markdownToHtml } from "satteri";
import { satteriCopyCode } from "@mirrordown/sat-copy-code";

const { html } = markdownToHtml(source, {
  hastPlugins: [satteriCopyCode()],
});

// In the page:
import "@mirrordown/sat-copy-code/copy-code.css";
import "@mirrordown/sat-copy-code/client";
```

### Astro

```ts
// astro.config.ts
import { defineConfig } from "astro/config";
import { satteri } from "@astrojs/markdown-satteri";
import { satteriCopyCode } from "@mirrordown/sat-copy-code";

export default defineConfig({
  markdown: {
    processor: satteri({ hastPlugins: [satteriCopyCode()] }),
  },
});
```

```astro
---
// In your layout:
import "@mirrordown/sat-copy-code/copy-code.css";
---

<script>
  import "@mirrordown/sat-copy-code/client";
</script>
```

## Documentation

Full documentation, more examples, and configuration options: [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown) (dedicated docs site coming soon).

## License

MIT © [Drake Costa](https://saeris.gg)
