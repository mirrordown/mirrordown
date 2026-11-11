# @mirrordown/mdit-tabs

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified, markdown-it and Sätteri ecosystems.

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

### Things to know

- Every line of a panel starts with `>`. A line that is neither a header nor a `>` line ends the tabs, and so does a blank line at the top level of the document.
- A blank line inside a panel needs the panel's `>`. Inside another block (a blockquote, a list item, a step), a blank line written without it ends the blocks before it (a list or a code fence does not continue across it), though the panel itself goes on with the next `>` line.
- A header is one line. Spaces at its end are not part of the label and make no line break, and a backslash at its end is a literal backslash.
- In a list item, write a blank line before the first header if text comes before it: without one, markdown-it starts the tabs there and remark and Sätteri leave the line as text. Don't underline a header with `===` or `---`, or indent a panel's `>` four columns or more: remark and Sätteri read those as CommonMark does (a heading, a paragraph), markdown-it as tabs.
- A group's ids (the `name` and `id` of its inputs, the `for` of its labels) are unique per document, not per page. They are built from the group's labels and its place among the document's groups, so two documents rendered into one page repeat them where the same labels appear in the same place.
- The stylesheet targets the default container class, `markdown-tabs`. With another `containerClass` the tabs are yours to style, and the tab-icons plugin needs the same value.
- `remarkTabs` reads each line's `>` markers from the file's source, so it needs a tree parsed from that same file with positions, as `remark-parse` produces.

## Install

```sh
npm install @mirrordown/mdit-tabs
```

### Standalone

```ts
import MarkdownIt from "markdown-it";
import { tabs } from "@mirrordown/mdit-tabs";
import "@mirrordown/mdit-tabs/tabs.css";

const md = new MarkdownIt().use(tabs);
```

### VitePress

```ts
// .vitepress/config.ts
import { defineConfig } from "vitepress";
import { tabs } from "@mirrordown/mdit-tabs";
import "@mirrordown/mdit-tabs/tabs.css";

export default defineConfig({
  markdown: {
    config: (md) => md.use(tabs),
  },
});
```

## Documentation

Full documentation, more examples, and configuration options: [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown) (dedicated docs site coming soon).

## License

MIT © [Drake Costa](https://saeris.gg)
