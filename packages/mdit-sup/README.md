# @mirrordown/mdit-sup

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified, markdown-it and Sätteri ecosystems.

A markdown-it plugin for the `sup` syntax extension.

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

The content is inline markup, like emphasis: it can hold spaces, other formatting and subscript, but can't start or end with a space. As with emphasis, a caret between a letter or digit and punctuation doesn't open or close one, so `10^-3^` and `x^(2)^` stay as written; after a space it does (`x ^-1^`).

````markdown
e^x~0~^ and the ^*n*th power^
````

A backslash keeps a caret literal (`x\^2\^`). A caret right after `[` opens a superscript like any other, so a footnote-style reference with no definition (`[^1] x^2^`) pairs with the next closing caret. A few things differ between the engines:

- Spans have to nest. When a superscript crosses a span another plugin builds (`==a ^b== c^`), each engine resolves it its own way. Crossing emphasis (`^a *b^ c*`) renders the same in all three.
- A run of two or more carets is plain text in markdown-it and remark. Sätteri pairs two runs of the same length, so `^^a^^` is a superscript there.
- Sätteri's superscript takes no attribute block: `x^2^{.s} y` sets the class with the markdown-it and remark attrs plugins and keeps the braces as text on Sätteri, where a block at the end of a paragraph, heading or list item sets the class on that element instead.

## Install

```sh
npm install @mirrordown/mdit-sup
```

### Standalone

```ts
import MarkdownIt from "markdown-it";
import { sup } from "@mirrordown/mdit-sup";

const md = new MarkdownIt().use(sup);
```

### VitePress

```ts
// .vitepress/config.ts
import { defineConfig } from "vitepress";
import { sup } from "@mirrordown/mdit-sup";

export default defineConfig({
  markdown: {
    config: (md) => md.use(sup),
  },
});
```

## Documentation

Full documentation, more examples, and configuration options: [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown) (dedicated docs site coming soon).

## License

MIT © [Drake Costa](https://saeris.gg)
