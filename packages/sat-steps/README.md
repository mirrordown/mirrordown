# @mirrordown/sat-steps

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified, markdown-it and Sätteri ecosystems.

A Sätteri plugin for the `steps` syntax extension.

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
@2. Configure your environment
> Copy `.env.example` to `.env` and fill in your values.
@3. Start the development server
> ```sh
> npm run dev
> ```
````

### Step titles are optional

Steps can have no title — just a body:

````markdown
@1.
> First thing to do.
@2.
> Second thing to do.
````

### Nested steps

Use `@@` to nest steps inside a parent step:

````markdown
@1. Set up the project
@@1. Create a new directory
> ```sh
> mkdir my-project && cd my-project
> ```
@@2. Initialize git
> ```sh
> git init
> ```
@2. Install dependencies
> ```sh
> npm install
> ```
````

## Install

```sh
npm install @mirrordown/sat-steps
```

### Standalone

```ts
import { markdownToHtml } from "satteri";
import { satteriSteps } from "@mirrordown/sat-steps";
import "@mirrordown/sat-steps/steps.css";

const { html } = markdownToHtml(source, {
  mdastPlugins: [satteriSteps()],
});
```

### Astro

```ts
// astro.config.ts
import { defineConfig } from "astro/config";
import { satteri } from "@astrojs/markdown-satteri";
import { satteriSteps } from "@mirrordown/sat-steps";

export default defineConfig({
  markdown: {
    processor: satteri({ mdastPlugins: [satteriSteps()] }),
  },
});

// In your layout:
import "@mirrordown/sat-steps/steps.css";
```

## Documentation

Full documentation, more examples, and configuration options: [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown) (dedicated docs site coming soon).

## License

MIT © [Drake Costa](https://saeris.gg)
