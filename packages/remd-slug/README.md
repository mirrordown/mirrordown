# @mirrordown/remd-slug

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified and markdown-it ecosystems.

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

Headings that already have an `id` (for example from [`attrs`](/guide/plugins/attrs) via `{#custom}`) are left untouched, and repeated heading text is de-duplicated with a numeric suffix (`overview`, `overview-1`, `overview-2`, …).

## Syntax

There is no special syntax — just write headings. Each one receives an `id` based on its text:

```markdown
### A Simple Heading

### Café & Crème

### A Simple Heading
```

The three headings above become `id="a-simple-heading"`, `id="café--crème"`, and `id="a-simple-heading-1"` respectively.

[!NOTE]
This is a rehype plugin (`rehype-*`), not a remark plugin. Add it **after** `remarkRehype` in your pipeline. To honor explicit `{#custom}` ids, place it after [`attrs`](/guide/plugins/attrs).

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
    rehypePlugins: [rehypeSlug]
  }
});
```

### VitePress

```ts
// .vitepress/config.ts
import { defineConfig } from "vitepress";
import { rehypeSlug } from "@mirrordown/remd-slug";

export default defineConfig({
  markdown: {
    rehypePlugins: [rehypeSlug]
  }
});
```

## Documentation

Full documentation, more examples, and configuration options: [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown) (dedicated docs site coming soon).

## License

MIT © [Drake Costa](https://saeris.gg)
