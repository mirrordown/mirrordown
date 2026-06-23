# @saeris/remd-mark

> Part of [`@saeris/markdown`](https://github.com/saeris/markdown) — a suite of markdown syntax extensions for the unified and markdown-it ecosystems.

A remark/rehype (unified) plugin for the `mark` syntax extension.

## Overview

The `mark` plugin renders `==text==` as an HTML `<mark>` element, representing highlighted or marked text.

```html
<mark>text</mark>
```

## Syntax

Wrap text in double equals signs to highlight it:

```markdown
==This text is highlighted.==

You can use it inline: remember to ==save your work== before closing.
```

## Usage

## Install

```sh
npm install @saeris/remd-mark
```

### Unified

```ts
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { remarkMark } from "@saeris/remd-mark";

const processor = unified()
  .use(remarkParse)
  .use(remarkMark)
  .use(remarkRehype)
  .use(rehypeStringify);
```

### Astro

```ts
// astro.config.ts
import { defineConfig } from "astro/config";
import { remarkMark } from "@saeris/remd-mark";

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkMark]
  }
});
```

### VitePress

```ts
// .vitepress/config.ts
import { defineConfig } from "vitepress";
import { remarkMark } from "@saeris/remd-mark";

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkMark]
  }
});
```

## Documentation

Full documentation, more examples, and configuration options: [saeris.github.io/markdown/guide/plugins/mark](https://saeris.github.io/markdown/guide/plugins/mark)

## License

MIT © [Drake Costa](https://saeris.gg)
