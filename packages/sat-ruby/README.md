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

A ruby is written on one line, and its first `|` splits it: the base holds no `{`, `}` or `|` (though it may start with `{`), and the reading runs to the next `}`. Spaces and tabs around the base and around the reading are dropped. A brace group without a `|`, such as an attribute block (`{.class}`), is never a ruby, and a ruby written right after one still is. Write `\{` to keep a brace literal. In a table cell, write the separator as `\|`.

Optionally pass `rp` parentheses for fallback rendering in unsupported browsers:

## Install

```sh
npm install @mirrordown/sat-ruby
```

It parses each base and reading on its own, with the document's features. List it first among the mdast plugins, since it re-reads its blocks from source: listed after a plugin that has already rebuilt a block, it only finds a ruby that sits whole inside one text node. The Sätteri preset does this for you.

With Sätteri's `attributes` feature on, a brace group that ends a block is read as an attribute block before any plugin runs, so a ruby there whose base starts with `.` or `#`, or holds `=`, is lost (`{.NET|ドットネット}` alone on a line). Put text after such a ruby.

With that feature on, an attribute block written right after a ruby goes on the ruby (`{漢字|かんじ}{.name}`), as it does with the attrs plugins of the other engines. One difference is the parser's: a table cell that holds a ruby holds an escaped pipe, and Sätteri reads no block of the cell's own there, so `| {漢字\|かんじ} {.name} |` keeps ` {.name}` as text.

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
