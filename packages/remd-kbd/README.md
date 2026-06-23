# @saeris/remd-kbd

> Part of [`@saeris/markdown`](https://github.com/saeris/markdown) — a suite of markdown syntax extensions for the unified and markdown-it ecosystems.

A remark/rehype (unified) plugin for the `kbd` syntax extension.

## Overview

The `kbd` plugin renders `[[key]]` as an HTML `<kbd>` element, representing keyboard input or a key name.

```html
<kbd>key</kbd>
```

## Syntax

Wrap a key name in double square brackets:

```markdown
Press [[Enter]] to confirm.

You can combine multiple keys: [[Ctrl]] + [[Shift]] + [[P]] opens the command palette.
```

## Usage

## Install

```sh
npm install @saeris/remd-kbd
```

### Unified

```ts
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { remarkKbd } from "@saeris/remd-kbd";

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
import { remarkKbd } from "@saeris/remd-kbd";

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkKbd]
  }
});
```

### VitePress

```ts
// .vitepress/config.ts
import { defineConfig } from "vitepress";
import { remarkKbd } from "@saeris/remd-kbd";

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkKbd]
  }
});
```

## Documentation

Full documentation, more examples, and configuration options: [saeris.github.io/markdown/guide/plugins/kbd](https://saeris.github.io/markdown/guide/plugins/kbd)

## License

MIT © [Drake Costa](https://saeris.gg)
