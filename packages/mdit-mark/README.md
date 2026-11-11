# @mirrordown/mdit-mark

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified, markdown-it and Sätteri ecosystems.

A markdown-it plugin for the `mark` syntax extension.

## Overview

The `mark` plugin renders `==text==` as an HTML `<mark>` element, representing highlighted or marked text.

```html
<mark>text</mark>
```

## Syntax

Wrap text in double equals signs to highlight it:

````markdown
==This text is highlighted.==

You can use it inline: remember to ==save your work== before closing.
````

A backslash keeps a delimiter literal (`\==not highlighted==`), and so does writing an equals sign as a character reference (`&#61;`). A few things differ between the engines:

- Spans have to nest. When a span crosses another one or crosses emphasis (`==a *b== c*`, `==a --b== c--`), each engine resolves it its own way, and in remark and Sätteri the result depends on the order the plugins are listed in.
- In image alt text (`![==a==](x.png)`), markdown-it drops the equals signs and remark and Sätteri keep the text as written.
- The remark plugin reads escapes from the source, so it needs the file: `processor.runSync(tree)` on a tree alone treats `\==` as `==`.

## Install

```sh
npm install @mirrordown/mdit-mark
```

### Standalone

```ts
import MarkdownIt from "markdown-it";
import { mark } from "@mirrordown/mdit-mark";

const md = new MarkdownIt().use(mark);
```

### VitePress

```ts
// .vitepress/config.ts
import { defineConfig } from "vitepress";
import { mark } from "@mirrordown/mdit-mark";

export default defineConfig({
  markdown: {
    config: (md) => md.use(mark),
  },
});
```

## Documentation

Full documentation, more examples, and configuration options: [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown) (dedicated docs site coming soon).

## License

MIT © [Drake Costa](https://saeris.gg)
