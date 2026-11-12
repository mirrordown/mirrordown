# @mirrordown/remd-autolink-headings

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified, markdown-it and Sätteri ecosystems.

A remark/rehype (unified) plugin for the `autolink-headings` syntax extension.

## Overview

The `autolink-headings` plugin adds a self-referential link to every heading that has an `id`, turning each heading into a shareable anchor. Pair it with [`slug`](/guide/plugins/slug) (or [`attrs`](/guide/plugins/attrs)) so the headings have ids to link to.

**Before:**
```html
<h2 id="getting-started">Getting Started</h2>
```

**After:**
```html
<h2 id="getting-started"><a class="anchor" aria-hidden="true" tabindex="-1" href="#getting-started"></a>Getting Started</h2>
```

By default the link is **empty** and carries `class="anchor"`. The shipped stylesheet draws a `#` marker via a CSS `::before` pseudo-element that fades in on hover — so no extra element is emitted, and there is no JavaScript involved.

## Syntax

There is no special syntax — just write headings. Hover one to reveal its link:

````markdown
### Hover Over This Heading

### And This One Too
````

> [!NOTE]
> For remark, this is a rehype plugin (`rehype-*`), not a remark plugin: add it **after** `remarkRehype`. In remark and Sätteri, add it **after** [`slug`](/guide/plugins/slug), so the headings already have ids; listed before it, no heading is linked. In markdown-it the two can be listed in either order. Import the stylesheet to get the default `#` marker.

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
    rehypePlugins: [rehypeSlug, rehypeAutolinkHeadings],
  },
});
```

## Options

| Option      | Type                                            | Default     | Description                                              |
| ----------- | ----------------------------------------------- | ----------- | ------------------------------------------------------- |
| `behavior`  | `"prepend" \| "append" \| "wrap" \| "before" \| "after"` | `"prepend"` | Where the link is placed relative to the heading. Any other value throws. |
| `class`     | `string`                                        | `"anchor"`  | The link's class. markdown-it only.                     |

`behavior` controls the structure:

- **`prepend`** / **`append`** — the link is the first / last child of the heading (`aria-hidden`, not focusable).
- **`wrap`** — the link wraps the heading's content.
- **`before`** / **`after`** — the link is a sibling placed before / after the heading.

With `wrap`, `before` and `after` the link carries only its class and `href`: it is focusable and not `aria-hidden`.

```ts
rehypeAutolinkHeadings({ behavior: "append" });
```

The markdown-it plugin accepts `behavior` plus a `class` option (default `"anchor"`) to rename the link's class. The rehype and Sätteri plugins have no `class` option: set the class with `properties`.

> [!NOTE]
> The rehype and Sätteri plugins additionally accept `content`, `properties`, `headingProperties`, `group`, and `test` options for full control over the emitted link — see [`rehype-autolink-headings`](https://github.com/rehypejs/rehype-autolink-headings) for their semantics. These take **hast** nodes and callbacks, which have no markdown-it equivalent: the markdown-it plugin ignores them.

With GFM footnotes, remark and Sätteri generate a "Footnotes" heading with the id `footnote-label`, and today it gets a link like any other heading. To leave it out, pass `test: (heading) => heading.properties.id !== "footnote-label"`.

## Documentation

Full documentation, more examples, and configuration options: [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown) (dedicated docs site coming soon).

## License

MIT © [Drake Costa](https://saeris.gg)
