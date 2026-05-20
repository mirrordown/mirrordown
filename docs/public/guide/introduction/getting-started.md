---
title: Getting Started
description: An introduction to @saeris/markdown — what it is, what it solves, and how to install it.
root: true
---

<style>
  @import url("../../markdown.css");
</style>

## What is @saeris/markdown?

`@saeris/markdown` is a collection of markdown syntax extensions for the [unified](https://unifiedjs.com) and [markdown-it](https://github.com/markdown-it/markdown-it) ecosystems. Each plugin is independently installable and adds a specific syntax enhancement to your markdown authoring experience — from inline formatting like `<del>` and `<ins>`, to rich block-level components like tabbed code groups and step-by-step guides.

The plugins are designed to work with [Astro](https://astro.build), [VitePress](https://vitepress.dev), and any toolchain built on [remark](https://github.com/remarkjs/remark) + [rehype](https://github.com/rehypejs/rehype).

## Why these plugins?

Standard CommonMark and GitHub Flavored Markdown cover the basics, but technical documentation often needs more:

- **Inline semantics** — strikethrough (`del`), insertion (`ins`), keyboard keys (`kbd`), highlighted text (`mark`), ruby annotations, abbreviations
- **Rich blocks** — tabbed content for multi-language examples, numbered step sequences, GitHub-style callout alerts
- **Structural helpers** — definition lists, attribute passthrough, image unwrapping for proper figure markup

Rather than pulling in a monolithic documentation framework, these plugins compose cleanly with your existing markdown pipeline.

## Installation

Each plugin is published separately under the `@saeris` scope. Install only what you need:

```sh
# Core inline plugins
yarn add @saeris/remd-del @saeris/remd-ins @saeris/remd-kbd @saeris/remd-mark

# Block-level components
yarn add @saeris/remd-tabs @saeris/remd-steps @saeris/remd-github-alerts

# Structural helpers
yarn add @saeris/remd-abbr @saeris/remd-attrs @saeris/remd-definition-list
yarn add @saeris/remd-ruby @saeris/remd-sub @saeris/remd-sup
yarn add @saeris/remd-unwrap-images
```

## Basic Setup (Astro)

Add the plugins to your `astro.config.ts`:

```ts
import { defineConfig } from "astro/config";
import { remarkDel } from "@saeris/remd-del";
import { remarkKbd } from "@saeris/remd-kbd";
import { remarkTabs, tabsHastHandlers } from "@saeris/remd-tabs";
import { remarkSteps, stepsHastHandlers } from "@saeris/remd-steps";

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
import "@saeris/remd-tabs/tabs.css";
import "@saeris/remd-steps/steps.css";
import "@saeris/remd-github-alerts/github-alerts.css";
```

## Next Steps

Browse the **Plugins** section in the sidebar to see syntax examples and configuration options for each extension.
