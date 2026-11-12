# @mirrordown/mdit-sub

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified, markdown-it and Sätteri ecosystems.

A markdown-it plugin for the `sub` syntax extension.

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

The content is inline markup, like emphasis: it can hold spaces, other formatting and superscript, but can't start or end with a space. As with emphasis, a tilde between a letter or digit and punctuation doesn't open or close one, so `10~-3~` and `H~(2)~O` stay as written; after a space it does (`x ~-1~`).

````markdown
x~n^2^~ and the ~*base* index~
````

A backslash keeps a tilde literal (`H\~2\~O`). Asterisks wrapped tightly around a subscript inside a word (`H**~2~**O`) are emphasis only with GFM, which lets emphasis sit against a `~`; in markdown-it that is the `strikethrough` rule, on by default. A few things differ between the engines:

- Spans have to nest. When a subscript crosses a span another plugin builds (`==a ~b== c~`, `--a ~b-- c~`), each engine resolves it its own way. Crossing emphasis (`~a *b~ c*`) renders the same in all three.
- With GFM off, Sätteri still reads `~~…~~` as a pair and finds no subscript inside it (`~~H~2~O~~`). markdown-it and remark do.
- Sätteri's subscript takes no attribute block: `x~2~{.s}` sets the class with the markdown-it and remark attrs plugins and keeps the braces as text on Sätteri, where a block at the end of a paragraph, heading or list item (`x~2~{.s}` alone on a line) sets the class on that element instead.

## Install

```sh
npm install @mirrordown/mdit-sub
```

### Standalone

```ts
import MarkdownIt from "markdown-it";
import { sub } from "@mirrordown/mdit-sub";

const md = new MarkdownIt().use(sub);
```

### VitePress

```ts
// .vitepress/config.ts
import { defineConfig } from "vitepress";
import { sub } from "@mirrordown/mdit-sub";

export default defineConfig({
  markdown: {
    config: (md) => md.use(sub),
  },
});
```

## Documentation

Full documentation, more examples, and configuration options: [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown) (dedicated docs site coming soon).

## License

MIT © [Drake Costa](https://saeris.gg)
