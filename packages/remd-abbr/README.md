# @saeris/remd-abbr

> Part of [`@saeris/markdown`](https://github.com/saeris/markdown) — a suite of markdown syntax extensions for the unified and markdown-it ecosystems.

A remark/rehype (unified) plugin for the `abbr` syntax extension.

## Overview

The `abbr` plugin lets you define abbreviations once and automatically wraps every occurrence in an `<abbr>` element with a `title` attribute for the full expansion.

```html
<abbr title="HyperText Markup Language">HTML</abbr>
```

## Syntax

Define abbreviations anywhere in the document using the `*[ABBR]: Full text` syntax. Definitions are removed from the output and all matching words are wrapped automatically.

```markdown
_[HTML]: HyperText Markup Language
_[CSS]: Cascading Style Sheets

Write HTML and CSS as normal — they are automatically expanded with tooltips.
```

## Usage

## Install

```sh
npm install @saeris/remd-abbr
```

### Unified

```ts
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { remarkAbbr } from "@saeris/remd-abbr";

const processor = unified()
  .use(remarkParse)
  .use(remarkAbbr)
  .use(remarkRehype)
  .use(rehypeStringify);
```

### Astro

```ts
// astro.config.ts
import { defineConfig } from "astro/config";
import { remarkAbbr } from "@saeris/remd-abbr";

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkAbbr]
  }
});
```

### VitePress

```ts
// .vitepress/config.ts
import { defineConfig } from "vitepress";
import { remarkAbbr } from "@saeris/remd-abbr";

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkAbbr]
  }
});
```

## Documentation

Full documentation, more examples, and configuration options: [saeris.github.io/markdown/guide/plugins/abbr](https://saeris.github.io/markdown/guide/plugins/abbr)

## License

MIT © [Drake Costa](https://saeris.gg)
