# @mirrordown/remd-steps

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified, markdown-it and Sätteri ecosystems.

A remark/rehype (unified) plugin for the `steps` syntax extension.

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

Install `@mirrordown/remd-steps`. You must also pass `stepsHastHandlers` to `remarkRehype` and import the stylesheet:

```sh
npm install @mirrordown/remd-steps
```

### Unified

```ts
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { remarkSteps, stepsHastHandlers } from "@mirrordown/remd-steps";
import "@mirrordown/remd-steps/steps.css";

const processor = unified()
  .use(remarkParse)
  .use(remarkSteps)
  .use(remarkRehype, { handlers: stepsHastHandlers })
  .use(rehypeStringify);
```

### Astro

```ts
// astro.config.ts
import { defineConfig } from "astro/config";
import { remarkSteps, stepsHastHandlers } from "@mirrordown/remd-steps";
import "@mirrordown/remd-steps/steps.css";

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkSteps],
    remarkRehype: { handlers: stepsHastHandlers },
  },
});
```

### VitePress

```ts
// .vitepress/config.ts
import { defineConfig } from "vitepress";
import { remarkSteps, stepsHastHandlers } from "@mirrordown/remd-steps";
import "@mirrordown/remd-steps/steps.css";

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkSteps],
    remarkRehype: { handlers: stepsHastHandlers },
  },
});
```

## Documentation

Full documentation, more examples, and configuration options: [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown) (dedicated docs site coming soon).

## License

MIT © [Drake Costa](https://saeris.gg)
