---
title: Getting Started
description: An introduction to @mirrordown/markdown — what it is, what it solves, and how to install it.
root: true
---

<style>
  @import url("../../markdown.css");
</style>

## What is @mirrordown/markdown?

`@mirrordown/markdown` is a collection of markdown syntax extensions for the [unified](https://unifiedjs.com) and [markdown-it](https://github.com/markdown-it/markdown-it) ecosystems. Each plugin is independently installable and adds a specific syntax enhancement to your markdown authoring experience — from inline formatting like `<del>` and `<ins>`, to rich block-level components like tabbed code groups and step-by-step guides.

The plugins are designed to work with [Astro](https://astro.build), [VitePress](https://vitepress.dev), and any toolchain built on [remark](https://github.com/remarkjs/remark) + [rehype](https://github.com/rehypejs/rehype).

## Why these plugins?

Standard CommonMark and GitHub Flavored Markdown cover the basics, but technical documentation often needs more:

- **Inline semantics** — strikethrough (`del`), insertion (`ins`), keyboard keys (`kbd`), highlighted text (`mark`), ruby annotations, abbreviations
- **Rich blocks** — tabbed content for multi-language examples, numbered step sequences, GitHub-style callout alerts
- **Structural helpers** — definition lists, attribute passthrough, image unwrapping for proper figure markup

Rather than pulling in a monolithic documentation framework, these plugins compose cleanly with your existing markdown pipeline.

## Installation

Each plugin is published separately under the `@mirrordown` scope. Install only what you need:

```sh
# Core inline plugins
yarn add @mirrordown/remd-del @mirrordown/remd-ins @mirrordown/remd-kbd @mirrordown/remd-mark

# Block-level components
yarn add @mirrordown/remd-tabs @mirrordown/remd-steps @mirrordown/remd-github-alerts

# Structural helpers
yarn add @mirrordown/remd-abbr @mirrordown/remd-attrs @mirrordown/remd-definition-list
yarn add @mirrordown/remd-ruby @mirrordown/remd-sub @mirrordown/remd-sup
yarn add @mirrordown/remd-unwrap-images
```

To use the whole suite, install a preset instead: [`@mirrordown/preset-remark`](https://github.com/mirrordown/mirrordown/tree/main/packages/preset-remark) or [`@mirrordown/preset-markdown-it`](https://github.com/mirrordown/mirrordown/tree/main/packages/preset-markdown-it) turns every feature on, and any of them off with `false`:

```ts
// astro.config.ts
import { defineConfig } from "astro/config";
import { unified } from "@astrojs/markdown-remark";
import { mirrordown } from "@mirrordown/preset-remark";

export default defineConfig({
  markdown: {
    processor: unified(mirrordown({ lightbox: false })),
  },
});
```

## Basic Setup (Astro)

Add the plugins to your `astro.config.ts`:

```ts
import { defineConfig } from "astro/config";
import { remarkDel } from "@mirrordown/remd-del";
import { remarkKbd } from "@mirrordown/remd-kbd";
import { remarkTabs, tabsHastHandlers } from "@mirrordown/remd-tabs";
import { remarkSteps, stepsHastHandlers } from "@mirrordown/remd-steps";

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkDel, remarkKbd, remarkTabs, remarkSteps],
    remarkRehype: {
      handlers: {
        ...tabsHastHandlers,
        ...stepsHastHandlers,
      },
    },
  },
});
```

Plugins that produce block-level HTML elements (tabs, steps, alerts) also need their stylesheet imported in your layout:

```ts
import "@mirrordown/remd-tabs/tabs.css";
import "@mirrordown/remd-steps/steps.css";
import "@mirrordown/remd-github-alerts/github-alerts.css";
```

## Next Steps

Browse the **Plugins** section in the sidebar to see syntax examples and configuration options for each extension.
