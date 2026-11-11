# @mirrordown/sat-ins

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified, markdown-it and Sätteri ecosystems.

A Sätteri plugin for the `ins` syntax extension.

## Overview

The `ins` plugin renders `++text++` as an HTML `<ins>` element, representing inserted or added text.

```html
<ins>text</ins>
```

## Syntax

Wrap text in double plus signs to mark it as inserted:

````markdown
++This text has been inserted.++

You can use it inline: the price is now ++$35++ (was $50).
````

A backslash keeps a delimiter literal (`\++not inserted++`), and so does writing a plus as a character reference (`&#43;`). A few things differ between the engines:

- Spans have to nest. When a span crosses another one or crosses emphasis (`++a *b++ c*`, `++a --b++ c--`), each engine resolves it its own way, and in remark and Sätteri the result depends on the order the plugins are listed in.
- In image alt text (`![++a++](x.png)`), markdown-it drops the plus signs and remark and Sätteri keep the text as written.
- The remark plugin reads escapes from the source, so it needs the file: `processor.runSync(tree)` on a tree alone treats `\++` as `++`.

## Install

```sh
npm install @mirrordown/sat-ins
```

### Standalone

```ts
import { markdownToHtml } from "satteri";
import { satteriIns } from "@mirrordown/sat-ins";

const { html } = markdownToHtml(source, {
  mdastPlugins: [satteriIns()],
});
```

### Astro

```ts
// astro.config.ts
import { defineConfig } from "astro/config";
import { satteri } from "@astrojs/markdown-satteri";
import { satteriIns } from "@mirrordown/sat-ins";

export default defineConfig({
  markdown: {
    processor: satteri({ mdastPlugins: [satteriIns()] }),
  },
});
```

## Documentation

Full documentation, more examples, and configuration options: [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown) (dedicated docs site coming soon).

## License

MIT © [Drake Costa](https://saeris.gg)
