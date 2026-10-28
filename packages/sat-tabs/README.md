# @mirrordown/sat-tabs

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified, markdown-it and Sätteri ecosystems.

A Sätteri plugin for the `tabs` syntax extension.

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

````markdown
% JavaScript
> ```js
> console.log("Hello, world!");
> ```
% TypeScript
> ```ts
> const greeting: string = "Hello, world!";
> console.log(greeting);
> ```
% Python
> ```py
> print("Hello, world!")
> ```
````

### Default open tab

Mark a tab with `%+` to make it open by default (the first tab is open by default otherwise):

````markdown
% Option A
> This tab is not selected by default.
%+ Option B
> This tab opens by default.
% Option C
> This tab is not selected by default.
````

### Nested tabs

Use `%%` for a second level of nesting inside a tab:

````markdown
% Frontend
%% React
> ```tsx
> export function App() {
>   return <h1>Hello</h1>;
> }
> ```
%% Vue
> ```vue
> <template><h1>Hello</h1></template>
> ```
% Backend
> Node.js or any server runtime.
````

## Install

Install `@mirrordown/sat-tabs` and import the stylesheet. List it after the plugins for inline syntax (mark, kbd and so on), so a panel's `aria-label` reads the label's text rather than its markup:

```sh
npm install @mirrordown/sat-tabs
```

### Standalone

```ts
import { markdownToHtml } from "satteri";
import { satteriTabs } from "@mirrordown/sat-tabs";
import "@mirrordown/sat-tabs/tabs.css";

const { html } = markdownToHtml(source, {
  mdastPlugins: [satteriTabs()],
});
```

### Astro

```ts
// astro.config.ts
import { defineConfig } from "astro/config";
import { satteri } from "@astrojs/markdown-satteri";
import { satteriTabs } from "@mirrordown/sat-tabs";

export default defineConfig({
  markdown: {
    processor: satteri({ mdastPlugins: [satteriTabs()] }),
  },
});

// In your layout:
import "@mirrordown/sat-tabs/tabs.css";
```

## Documentation

Full documentation, more examples, and configuration options: [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown) (dedicated docs site coming soon).

## License

MIT © [Drake Costa](https://saeris.gg)
