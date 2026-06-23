# @saeris/remd-definition-list

> Part of [`@saeris/markdown`](https://github.com/saeris/markdown) — a suite of markdown syntax extensions for the unified and markdown-it ecosystems.

A remark/rehype (unified) plugin for the `definition-list` syntax extension.

## Overview

The `definition-list` plugin renders Pandoc-style definition lists as HTML `<dl>`, `<dt>`, and `<dd>` elements.

```html
<dl>
  <dt>Term</dt>
  <dd>Definition</dd>
</dl>
```

## Syntax

Write a term on one line, then follow it with one or more definitions prefixed by `: ` or `~ `:

```markdown
Apple
: A round fruit with red or green skin.
: Also a technology company.

Orange
: A citrus fruit with orange skin.

Multiple terms can share definitions:

HTTP
HTTPS
: Protocols for transferring data on the web.
```

## Usage

## Install

Install `@saeris/remd-definition-list`. You must also pass `defListHastHandlers` to `remarkRehype` so the custom AST nodes are converted to HTML correctly:

```sh
npm install @saeris/remd-definition-list
```

### Unified

```ts
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import {
  remarkDefinitionList,
  defListHastHandlers
} from "@saeris/remd-definition-list";

const processor = unified()
  .use(remarkParse)
  .use(remarkDefinitionList)
  .use(remarkRehype, { handlers: defListHastHandlers })
  .use(rehypeStringify);
```

### Astro

```ts
// astro.config.ts
import { defineConfig } from "astro/config";
import {
  remarkDefinitionList,
  defListHastHandlers
} from "@saeris/remd-definition-list";

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkDefinitionList],
    remarkRehype: { handlers: defListHastHandlers }
  }
});
```

### VitePress

```ts
// .vitepress/config.ts
import { defineConfig } from "vitepress";
import {
  remarkDefinitionList,
  defListHastHandlers
} from "@saeris/remd-definition-list";

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkDefinitionList],
    remarkRehype: { handlers: defListHastHandlers }
  }
});
```

## Documentation

Full documentation, more examples, and configuration options: [saeris.github.io/markdown/guide/plugins/definition-list](https://saeris.github.io/markdown/guide/plugins/definition-list)

## License

MIT © [Drake Costa](https://saeris.gg)
