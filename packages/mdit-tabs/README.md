# @saeris/mdit-tabs

> Part of [`@saeris/markdown`](https://github.com/saeris/markdown) — a suite of markdown syntax extensions for the unified and markdown-it ecosystems.

A markdown-it plugin for the `tabs` syntax extension.

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
>
> % TypeScript
>
> ```ts
> const greeting: string = "Hello, world!";
> console.log(greeting);
> ```
>
> % Python
>
> ```py
> print("Hello, world!")
> ```
````

### Default open tab

Mark a tab with `%+` to make it open by default (the first tab is open by default otherwise):

```markdown
% Option A

> This tab is not selected by default.
> %+ Option B
> This tab opens by default.
> % Option C
> This tab is not selected by default.
```

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
>
> %% Vue
>
> ```vue
> <template><h1>Hello</h1></template>
> ```
>
> % Backend
> Node.js or any server runtime.
````

## Usage

## Install

```sh
npm install @saeris/mdit-tabs
```

### Standalone

```ts
import MarkdownIt from "markdown-it";
import { tabs } from "@saeris/mdit-tabs";
import "@saeris/mdit-tabs/tabs.css";

const md = new MarkdownIt().use(tabs);
```

### VitePress

```ts
// .vitepress/config.ts
import { defineConfig } from "vitepress";
import { tabs } from "@saeris/mdit-tabs";
import "@saeris/mdit-tabs/tabs.css";

export default defineConfig({
  markdown: {
    config: (md) => md.use(tabs)
  }
});
```

## Documentation

Full documentation, more examples, and configuration options: [saeris.github.io/markdown/guide/plugins/tabs](https://saeris.github.io/markdown/guide/plugins/tabs)

## License

MIT © [Drake Costa](https://saeris.gg)
