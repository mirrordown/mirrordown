# @saeris/remd-attrs

> Part of [`@saeris/markdown`](https://github.com/saeris/markdown) — a suite of markdown syntax extensions for the unified and markdown-it ecosystems.

A remark/rehype (unified) plugin for the `attrs` syntax extension.

## Overview

The `attrs` plugin lets you attach HTML attributes (classes, IDs, data attributes, etc.) to almost any Markdown element using `{...}` syntax. It supports headings, paragraphs, code fences, inline elements, lists, tables, and horizontal rules.

```html
<h2 id="my-section" class="highlight">My Section</h2>
```

## Syntax

Attributes are written in curly braces using CSS-like shorthand:

- `#id` → sets `id`
- `.class` → adds a class
- `key=value` → sets any attribute

### Headings

```markdown
## My Section {#my-section .highlight}
```

### Code fences

````markdown
```ts {.language-typescript data-filename="example.ts"}
const x = 1;
```
````

### Paragraphs

```markdown
A paragraph with a custom class.
{.note}
```

### Inline elements

```markdown
This is **important**{.warning} text.
```

### After lists and tables

```markdown
- Item one
- Item two
  {.checklist}
```

## Usage

## Install

```sh
npm install @saeris/remd-attrs
```

### Unified

```ts
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { remarkAttrs } from "@saeris/remd-attrs";

const processor = unified()
  .use(remarkParse)
  .use(remarkAttrs)
  .use(remarkRehype)
  .use(rehypeStringify);
```

### Astro

```ts
// astro.config.ts
import { defineConfig } from "astro/config";
import { remarkAttrs } from "@saeris/remd-attrs";

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkAttrs]
  }
});
```

### VitePress

```ts
// .vitepress/config.ts
import { defineConfig } from "vitepress";
import { remarkAttrs } from "@saeris/remd-attrs";

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkAttrs]
  }
});
```

## Documentation

Full documentation, more examples, and configuration options: [saeris.github.io/markdown/guide/plugins/attrs](https://saeris.github.io/markdown/guide/plugins/attrs)

## License

MIT © [Drake Costa](https://saeris.gg)
