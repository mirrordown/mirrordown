# @mirrordown/remd-autolink-headings

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified and markdown-it ecosystems.

A remark/rehype (unified) plugin for the `autolink-headings` syntax extension.

## Overview

The `autolink-headings` plugin adds a self-referential link to every heading that has an `id`, turning each heading into a shareable anchor. Pair it with [`slug`](/guide/plugins/slug) (or [`attrs`](/guide/plugins/attrs)) so the headings have ids to link to.

**Before:**

```html
<h2 id="getting-started">Getting Started</h2>
```

**After:**

```html
<h2 id="getting-started">
  <a class="anchor" aria-hidden="true" tabindex="-1" href="#getting-started"></a
  >Getting Started
</h2>
```

By default the link is **empty** and carries `class="anchor"`. The shipped stylesheet draws a `#` marker via a CSS `::before` pseudo-element that fades in on hover — so no extra element is emitted, and there is no JavaScript involved.

## Syntax

There is no special syntax — just write headings. Hover one to reveal its link:

```markdown
### Hover Over This Heading

### And This One Too
```

[!NOTE]
This is a rehype plugin (`rehype-*`), not a remark plugin. Add it **after** `remarkRehype`, and **after** [`slug`](/guide/plugins/slug), so the headings already have ids. Import the stylesheet to get the default `#` marker.

## Install

```sh
npm install @mirrordown/remd-autolink-headings
```

### Unified

```ts
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { rehypeSlug } from "@mirrordown/remd-slug";
import { rehypeAutolinkHeadings } from "@mirrordown/remd-autolink-headings";
import "@mirrordown/remd-autolink-headings/autolink-headings.css";

const processor = unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(rehypeSlug)
  .use(rehypeAutolinkHeadings)
  .use(rehypeStringify);
```

### Astro

```ts
// astro.config.ts
import { defineConfig } from "astro/config";
import { rehypeSlug } from "@mirrordown/remd-slug";
import { rehypeAutolinkHeadings } from "@mirrordown/remd-autolink-headings";

export default defineConfig({
  markdown: {
    rehypePlugins: [rehypeSlug, rehypeAutolinkHeadings]
  }
});
```

### VitePress

```ts
// .vitepress/config.ts
import { defineConfig } from "vitepress";
import { rehypeSlug } from "@mirrordown/remd-slug";
import { rehypeAutolinkHeadings } from "@mirrordown/remd-autolink-headings";

export default defineConfig({
  markdown: {
    rehypePlugins: [rehypeSlug, rehypeAutolinkHeadings]
  }
});
```

## Documentation

Full documentation, more examples, and configuration options: [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown) (dedicated docs site coming soon).

## License

MIT © [Drake Costa](https://saeris.gg)
