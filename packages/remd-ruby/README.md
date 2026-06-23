# @saeris/remd-ruby

> Part of [`@saeris/markdown`](https://github.com/saeris/markdown) — a suite of markdown syntax extensions for the unified and markdown-it ecosystems.

A remark/rehype (unified) plugin for the `ruby` syntax extension.

## Overview

The `ruby` plugin renders `{base|reading}` as HTML `<ruby>` annotations, used for pronunciation guides in East Asian text.

```html
<ruby>base<rt>reading</rt></ruby>
```

## Syntax

Use `{base text|reading}` inline to annotate characters with their pronunciation or reading:

```markdown
{漢字|かんじ} are Chinese-derived characters used in Japanese writing.

{東京|とうきょう} is the capital of Japan.
```

Optionally pass `rp` parentheses for fallback rendering in unsupported browsers:

## Usage

## Install

```sh
npm install @saeris/remd-ruby
```

### Unified

```ts
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { remarkRuby } from "@saeris/remd-ruby";

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
import { remarkRuby } from "@saeris/remd-ruby";

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkRuby]
  }
});
```

### VitePress

```ts
// .vitepress/config.ts
import { defineConfig } from "vitepress";
import { remarkRuby } from "@saeris/remd-ruby";

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkRuby]
  }
});
```

## Documentation

Full documentation, more examples, and configuration options: [saeris.github.io/markdown/guide/plugins/ruby](https://saeris.github.io/markdown/guide/plugins/ruby)

## License

MIT © [Drake Costa](https://saeris.gg)
