# @mirrordown/remd-ruby

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified, markdown-it and Sätteri ecosystems.

A remark/rehype (unified) plugin for the `ruby` syntax extension.

## Overview

The `ruby` plugin renders `{base|reading}` as HTML `<ruby>` annotations, used for pronunciation guides in East Asian text.

```html
<ruby>base<rt>reading</rt></ruby>
```

## Syntax

Use `{base text|reading}` inline to annotate characters with their pronunciation or reading:

````markdown
{漢字|かんじ} are Chinese-derived characters used in Japanese writing.

{東京|とうきょう} is the capital of Japan.
````

A ruby is written on one line, and its first `|` splits it: the base holds no `{`, `}` or `|` (though it may start with `{`), and the reading runs to the next `}`. Spaces and tabs around the base and around the reading are dropped. A brace group without a `|`, such as an attribute block (`{.class}`), is never a ruby, and a ruby written right after one still is. Write `\{` to keep a brace literal. In a table cell, write the separator as `\|`.

Optionally pass `rp` parentheses for fallback rendering in unsupported browsers:

## Install

```sh
npm install @mirrordown/remd-ruby
```

### Unified

```ts
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { remarkRuby } from "@mirrordown/remd-ruby";

const processor = unified()
  .use(remarkParse)
  .use(remarkRuby)
  .use(remarkRehype)
  .use(rehypeStringify);

// With ruby parentheses for fallback support:
const processorWithRp = unified()
  .use(remarkParse)
  .use(remarkRuby, { rp: ["(", ")"] })
  .use(remarkRehype)
  .use(rehypeStringify);
```

### Astro

```ts
// astro.config.ts
import { defineConfig } from "astro/config";
import { remarkRuby } from "@mirrordown/remd-ruby";

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkRuby],
  },
});
```

## Documentation

Full documentation, more examples, and configuration options: [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown) (dedicated docs site coming soon).

## License

MIT © [Drake Costa](https://saeris.gg)
