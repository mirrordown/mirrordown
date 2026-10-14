# @mirrordown/remd-sup

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified, markdown-it and Sätteri ecosystems.

A remark/rehype (unified) plugin for the `sup` syntax extension.

## Overview

The `sup` plugin renders `^text^` as an HTML `<sup>` element, representing superscript text.

```html
<sup>text</sup>
```

## Syntax

Wrap text in single carets to render it as superscript:

````markdown
E = mc^2^

The Pythagorean theorem: a^2^ + b^2^ = c^2^
````

### Formatting inside

The content is inline markup, like emphasis: it can hold spaces, other formatting and subscript, but can't start or end with a space.

````markdown
e^x~0~^ and the ^*n*th power^
````

## Install

```sh
npm install @mirrordown/remd-sup
```

### Unified

```ts
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { remarkSup } from "@mirrordown/remd-sup";

const processor = unified()
  .use(remarkParse)
  .use(remarkSup)
  .use(remarkRehype)
  .use(rehypeStringify);
```

### Astro

```ts
// astro.config.ts
import { defineConfig } from "astro/config";
import { remarkSup } from "@mirrordown/remd-sup";

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkSup],
  },
});
```

## Documentation

Full documentation, more examples, and configuration options: [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown) (dedicated docs site coming soon).

## License

MIT © [Drake Costa](https://saeris.gg)
