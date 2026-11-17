# @mirrordown/remd-slug

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified, markdown-it and Sätteri ecosystems.

A remark/rehype (unified) plugin for the `slug` syntax extension.

## Overview

The `slug` plugin adds an `id` to every heading (`<h1>`–`<h6>`), derived from the heading's text content using [`github-slugger`](https://github.com/Flet/github-slugger) — the same algorithm GitHub uses. This gives every heading a stable, predictable anchor target.

**Before:**
```html
<h2>Getting Started</h2>
```

**After:**
```html
<h2 id="getting-started">Getting Started</h2>
```

Headings that already have an `id` (for example from [`attrs`](/guide/plugins/attrs) via `{#custom}`) are left untouched, and repeated heading text is de-duplicated with a numeric suffix (`overview`, `overview-1`, `overview-2`, …). A generated id never repeats one written by hand, wherever in the document that one is: with `## Other {#overview}` anywhere on the page, a heading titled "Overview" gets `overview-1`. Two ids written by hand that are the same are both kept as written.

A heading with no text to make a slug from (`## !!!`, or an emoji alone) gets an empty `id=""` today, and the next such headings get `-1`, `-2`, and so on.

## Syntax

There is no special syntax — just write headings. Each one receives an `id` based on its text:

````markdown
### A Simple Heading

### Café & Crème

### A Simple Heading
````

The three headings above become `id="a-simple-heading"`, `id="café--crème"`, and `id="a-simple-heading-1"` respectively.

> [!NOTE]
> For remark, this is a rehype plugin (`rehype-*`), not a remark plugin: add it **after** `remarkRehype` in your pipeline. Explicit `{#custom}` ids from [`attrs`](/guide/plugins/attrs) are honored in every engine, in whichever order the two plugins are listed.

## Install

```sh
npm install @mirrordown/remd-slug
```

### Unified

```ts
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { rehypeSlug } from "@mirrordown/remd-slug";

const processor = unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(rehypeSlug)
  .use(rehypeStringify);
```

### Astro

```ts
// astro.config.ts
import { defineConfig } from "astro/config";
import { rehypeSlug } from "@mirrordown/remd-slug";

export default defineConfig({
  markdown: {
    rehypePlugins: [rehypeSlug],
  },
});
```

## Options

| Option   | Type     | Default | Description                              |
| -------- | -------- | ------- | ---------------------------------------- |
| `prefix` | `string` | `""`    | Prepended to every generated `id` value. An id written by hand is left without it. |

```ts
rehypeSlug({ prefix: "user-content-" });
// <h2 id="user-content-getting-started">Getting Started</h2>
```

The markdown-it and Sätteri plugins accept the same `prefix` option: `md.use(slug, { prefix: "user-content-" })` and `satteriSlug({ prefix: "user-content-" })`.

## Documentation

Full documentation, more examples, and configuration options: [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown) (dedicated docs site coming soon).

## License

MIT © [Drake Costa](https://saeris.gg)
