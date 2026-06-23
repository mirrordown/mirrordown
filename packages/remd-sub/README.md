# @saeris/remd-sub

> Part of [`@saeris/markdown`](https://github.com/saeris/markdown) — a suite of markdown syntax extensions for the unified and markdown-it ecosystems.

A remark/rehype (unified) plugin for the `sub` syntax extension.

## Overview

The `sub` plugin renders `~text~` as an HTML `<sub>` element, representing subscript text.

```html
<sub>text</sub>
```

## Syntax

Wrap text in single tildes to render it as subscript:

```markdown
The chemical formula for water is H~2~O.

Carbon dioxide is CO~2~.
```

## Usage

## Install

```sh
npm install @saeris/remd-sub
```

### Unified

```ts
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { remarkSub } from "@saeris/remd-sub";

const processor = unified()
  .use(remarkParse)
  .use(remarkSub)
  .use(remarkRehype)
  .use(rehypeStringify);
```

### Astro

```ts
// astro.config.ts
import { defineConfig } from "astro/config";
import { remarkSub } from "@saeris/remd-sub";

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkSub]
  }
});
```

### VitePress

```ts
// .vitepress/config.ts
import { defineConfig } from "vitepress";
import { remarkSub } from "@saeris/remd-sub";

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkSub]
  }
});
```

## Documentation

Full documentation, more examples, and configuration options: [saeris.github.io/markdown/guide/plugins/sub](https://saeris.github.io/markdown/guide/plugins/sub)

## License

MIT © [Drake Costa](https://saeris.gg)
