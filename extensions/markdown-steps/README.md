# Markdown Steps

Adds steps syntax support to VSCode's markdown preview.

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

````markdown
@1. Install dependencies

> ```sh
> npm install
> ```
>
> @2. Configure your environment
> Copy `.env.example` to `.env` and fill in your values.
> @3. Start the development server
>
> ```sh
> npm run dev
> ```
````

### Step titles are optional

Steps can have no title — just a body:

```markdown
@1.

> First thing to do.
> @2.
> Second thing to do.
```

### Nested steps

Use `@@` to nest steps inside a parent step:

````markdown
@1. Set up the project
@@1. Create a new directory

> ```sh
> mkdir my-project && cd my-project
> ```
>
> @@2. Initialize git
>
> ```sh
> git init
> ```
>
> @2. Install dependencies
>
> ```sh
> npm install
> ```
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

Powered by [`@mirrordown/mdit-steps`](https://www.npmjs.com/package/@mirrordown/mdit-steps) · Source on [GitHub](https://github.com/mirrordown/mirrordown).
