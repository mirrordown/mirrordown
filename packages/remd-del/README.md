# @mirrordown/remd-del

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified and markdown-it ecosystems.

A remark/rehype (unified) plugin for the `del` syntax extension.

## Overview

The `del` plugin renders `--text--` as an HTML `<del>` element, representing deleted or struck-through text.

```html
<del>text</del>
```

## Syntax

Wrap text in double dashes to mark it as deleted:

````markdown
--This text has been deleted.--

You can use it inline: the price was --$50-- $35.
````

## Install

```sh
npm install @mirrordown/remd-del
```

### Unified

```ts
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { remarkDel } from "@mirrordown/remd-del";

const processor = unified()
  .use(remarkParse)
  .use(remarkDel)
  .use(remarkRehype)
  .use(rehypeStringify);
```

### Astro

```ts
// astro.config.ts
import { defineConfig } from "astro/config";
import { remarkDel } from "@mirrordown/remd-del";

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkDel],
  },
});
```

## Documentation

Full documentation, more examples, and configuration options: [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown) (dedicated docs site coming soon).

## License

MIT © [Drake Costa](https://saeris.gg)
