# @mirrordown/sat-ruby

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified, markdown-it and Sätteri ecosystems.

A Sätteri plugin for the `ruby` syntax extension.

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

Optionally pass `rp` parentheses for fallback rendering in unsupported browsers:

## Install

```sh
npm install @mirrordown/sat-ruby
```

It parses each base and reading on its own, with the document's features. List it before other mdast plugins, since it re-reads its blocks from source. The Sätteri preset does this for you.

### Standalone

```ts
import { markdownToHtml } from "satteri";
import { satteriRuby } from "@mirrordown/sat-ruby";

const { html } = markdownToHtml(source, {
  mdastPlugins: [satteriRuby()],
});
```

### Astro

```ts
// astro.config.ts
import { defineConfig } from "astro/config";
import { satteri } from "@astrojs/markdown-satteri";
import { satteriRuby } from "@mirrordown/sat-ruby";

export default defineConfig({
  markdown: {
    processor: satteri({ mdastPlugins: [satteriRuby()] }),
  },
});
```

## Documentation

Full documentation, more examples, and configuration options: [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown) (dedicated docs site coming soon).

## License

MIT © [Drake Costa](https://saeris.gg)
