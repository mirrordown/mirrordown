# @mirrordown/remd-kbd

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified, markdown-it and Sätteri ecosystems.

A remark/rehype (unified) plugin for the `kbd` syntax extension.

## Overview

The `kbd` plugin renders `[[key]]` as an HTML `<kbd>` element, representing keyboard input or a key name.

```html
<kbd>key</kbd>
```

## Syntax

Wrap a key name in double square brackets:

````markdown
Press [[Enter]] to confirm.

You can combine multiple keys: [[Ctrl]] + [[Shift]] + [[P]] opens the command palette.
````

> [!NOTE]
> Formatting that crosses a key's brackets, such as `[[*a]]*`, renders differently by engine: markdown-it reads the key first, while remark and Sätteri have already read the emphasis when the plugin runs. Keep formatting inside or outside the brackets.

## Install

```sh
npm install @mirrordown/remd-kbd
```

### Unified

```ts
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { remarkKbd } from "@mirrordown/remd-kbd";

const processor = unified()
  .use(remarkParse)
  .use(remarkKbd)
  .use(remarkRehype)
  .use(rehypeStringify);
```

### Astro

```ts
// astro.config.ts
import { defineConfig } from "astro/config";
import { remarkKbd } from "@mirrordown/remd-kbd";

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkKbd],
  },
});
```

## Documentation

Full documentation, more examples, and configuration options: [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown) (dedicated docs site coming soon).

## License

MIT © [Drake Costa](https://saeris.gg)
