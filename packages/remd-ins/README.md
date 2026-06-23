# @saeris/remd-ins

> Part of [`@saeris/markdown`](https://github.com/saeris/markdown) — a suite of markdown syntax extensions for the unified and markdown-it ecosystems.

A remark/rehype (unified) plugin for the `ins` syntax extension.

## Overview

The `ins` plugin renders `++text++` as an HTML `<ins>` element, representing inserted or added text.

```html
<ins>text</ins>
```

## Syntax

Wrap text in double plus signs to mark it as inserted:

```markdown
++This text has been inserted.++

You can use it inline: the price is now ++$35++ (was $50).
```

## Usage

## Install

```sh
npm install @saeris/remd-ins
```

### Unified

```ts
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { remarkIns } from "@saeris/remd-ins";

const processor = unified()
  .use(remarkParse)
  .use(remarkIns)
  .use(remarkRehype)
  .use(rehypeStringify);
```

### Astro

```ts
// astro.config.ts
import { defineConfig } from "astro/config";
import { remarkIns } from "@saeris/remd-ins";

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkIns]
  }
});
```

### VitePress

```ts
// .vitepress/config.ts
import { defineConfig } from "vitepress";
import { remarkIns } from "@saeris/remd-ins";

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkIns]
  }
});
```

## Documentation

Full documentation, more examples, and configuration options: [saeris.github.io/markdown/guide/plugins/ins](https://saeris.github.io/markdown/guide/plugins/ins)

## License

MIT © [Drake Costa](https://saeris.gg)
