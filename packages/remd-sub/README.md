# @mirrordown/remd-sub

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified and markdown-it ecosystems.

A remark/rehype (unified) plugin for the `sub` syntax extension.

## Overview

The `sub` plugin renders `~text~` as an HTML `<sub>` element, representing subscript text.

```html
<sub>text</sub>
```

## Syntax

Wrap text in single tildes to render it as subscript:

````markdown
The chemical formula for water is H~2~O.

Carbon dioxide is CO~2~.
````

### Formatting inside

The content is inline markup, like emphasis: it can hold spaces, other formatting and superscript, but can't start or end with a space.

````markdown
x~n^2^~ and the ~*base* index~
````

## Install

```sh
npm install @mirrordown/remd-sub
```

### Unified

```ts
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { remarkSub } from "@mirrordown/remd-sub";

const processor = unified()
  .use(remarkParse)
  // With GFM, turn off single-tilde strikethrough, which would take `~text~` first:
  // .use(remarkGfm, { singleTilde: false })
  .use(remarkSub)
  .use(remarkRehype)
  .use(rehypeStringify);
```

### Astro

```ts
// astro.config.ts
import { defineConfig } from "astro/config";
import remarkGfm from "remark-gfm";
import { remarkSub } from "@mirrordown/remd-sub";

export default defineConfig({
  markdown: {
    // Astro's own GFM uses single-tilde strikethrough, which takes `~text~` first.
    gfm: false,
    remarkPlugins: [[remarkGfm, { singleTilde: false }], remarkSub],
  },
});
```

## Documentation

Full documentation, more examples, and configuration options: [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown) (dedicated docs site coming soon).

## License

MIT © [Drake Costa](https://saeris.gg)
