# @mirrordown/remd-definition-list

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified, markdown-it and Sätteri ecosystems.

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

````markdown
Apple
: A round fruit with red or green skin.
: Also a technology company.

Orange
: A citrus fruit with orange skin.
````

A term fits on one line: a marker after a paragraph of two or more lines continues that paragraph instead of starting a list, as in Pandoc.

Each definition is tight or loose on its own. A definition is loose, and wraps its content in `<p>`, when a blank line comes directly before its marker or separates blocks inside it. Otherwise its paragraphs render unwrapped. A marker with nothing after it produces an empty `<dd>`.

### Styling

The plugin ships no stylesheet: `<dl>`, `<dt>` and `<dd>` get the browser's defaults, which indent each definition and leave its term plain. The examples in the Mirrordown docs use the docs' own styles, which bold the term and set each definition off with a rule:

```css
dt {
  font-weight: 600;
}

dd {
  margin-inline-start: 0.25rem;
  padding-inline-start: 1rem;
  border-inline-start: 2px solid #e5e7eb;
}
```

## Install

Install `@mirrordown/remd-definition-list`. You must also pass `defListHastHandlers` to `remarkRehype` so the custom AST nodes are converted to HTML correctly:

```sh
npm install @mirrordown/remd-definition-list
```

### Unified

```ts
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { remarkDefinitionList, defListHastHandlers } from "@mirrordown/remd-definition-list";

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
import { remarkDefinitionList, defListHastHandlers } from "@mirrordown/remd-definition-list";

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkDefinitionList],
    remarkRehype: { handlers: defListHastHandlers },
  },
});
```

## Documentation

Full documentation, more examples, and configuration options: [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown) (dedicated docs site coming soon).

## License

MIT © [Drake Costa](https://saeris.gg)
