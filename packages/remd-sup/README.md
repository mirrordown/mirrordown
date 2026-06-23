# @saeris/remd-sup

> Part of [`@saeris/markdown`](https://github.com/saeris/markdown) — a suite of markdown syntax extensions for the unified and markdown-it ecosystems.

A remark/rehype (unified) plugin for the `sup` syntax extension.

## Overview

The `sup` plugin renders `^text^` as an HTML `<sup>` element, representing superscript text.

```html
<sup>text</sup>
```

## Syntax

Wrap text in single carets to render it as superscript:

```markdown
E = mc^2^

The Pythagorean theorem: a^2^ + b^2^ = c^2^
```

## Usage

## Install

```sh
npm install @saeris/remd-sup
```

### Unified

```ts
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { remarkSup } from "@saeris/remd-sup";

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
import { remarkSup } from "@saeris/remd-sup";

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkSup]
  }
});
```

### VitePress

```ts
// .vitepress/config.ts
import { defineConfig } from "vitepress";
import { remarkSup } from "@saeris/remd-sup";

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkSup]
  }
});
```

## Documentation

Full documentation, more examples, and configuration options: [saeris.github.io/markdown/guide/plugins/sup](https://saeris.github.io/markdown/guide/plugins/sup)

## License

MIT © [Drake Costa](https://saeris.gg)
