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

A backslash keeps a caret literal (`x\^2\^`). A caret right after `[` opens a superscript like any other, so a footnote-style reference with no definition (`[^1] x^2^`) pairs with the next closing caret. A few things differ between the engines:

- Spans have to nest. When a superscript crosses another span or crosses emphasis (`^a *b^ c*`, `==a ^b== c^`), each engine resolves it its own way.
- A run of two or more carets is plain text in markdown-it and remark. Sätteri pairs two runs of the same length, so `^^a^^` is a superscript there.
- Sätteri's superscript takes no attribute block: `x^2^{.s} y` sets the class with the markdown-it and remark attrs plugins and keeps the braces as text on Sätteri, where a block at the end of a paragraph, heading or list item sets the class on that element instead.

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
