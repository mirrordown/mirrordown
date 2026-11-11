# @mirrordown/remd-sub

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified, markdown-it and Sätteri ecosystems.

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

A backslash keeps a tilde literal (`H\~2\~O`). Asterisks wrapped tightly around a subscript inside a word (`H**~2~**O`) are emphasis only with GFM, which lets emphasis sit against a `~`; in markdown-it that is the `strikethrough` rule, on by default. A few things differ between the engines:

- Spans have to nest. When a subscript crosses another span or crosses emphasis (`~a *b~ c*`, `==a ~b== c~`), each engine resolves it its own way.
- With GFM off, Sätteri still reads `~~…~~` as a pair and finds no subscript inside it (`~~H~2~O~~`). markdown-it and remark do.
- Sätteri's subscript takes no attribute block: `x~2~{.s}` sets the class with the markdown-it and remark attrs plugins and keeps the braces as text on Sätteri.

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
  // With GFM, turn off single-tilde strikethrough. Left on, whichever of the two plugins is added later takes `~text~`:
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
    // Astro's own GFM keeps single-tilde strikethrough on. Replacing it means `~text~` doesn't depend on the order plugins are added in.
    gfm: false,
    remarkPlugins: [[remarkGfm, { singleTilde: false }], remarkSub],
  },
});
```

## Documentation

Full documentation, more examples, and configuration options: [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown) (dedicated docs site coming soon).

## License

MIT © [Drake Costa](https://saeris.gg)
