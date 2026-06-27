# Markdown Tabs

Adds tabs syntax support to VSCode's markdown preview.

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

## Styling

This extension ships default styles for the rendered output in the preview. To
customize them, point VSCode's `markdown.styles` setting at your own CSS file:

```jsonc
// .vscode/settings.json
{
  "markdown.styles": ["./my-preview-styles.css"]
}
```

## About

Part of **[Markdown Preview Extended Syntax](https://marketplace.visualstudio.com/items?itemName=saeris.markdown-preview-extended-syntax)** — a pack of Markdown preview syntax extensions you can install all at once.

Powered by [`@mirrordown/mdit-tabs`](https://www.npmjs.com/package/@mirrordown/mdit-tabs) · Source on [GitHub](https://github.com/mirrordown/mirrordown).
