# @saeris/mdit-abbr

> Part of [`@saeris/markdown`](https://github.com/saeris/markdown) — a suite of markdown syntax extensions for the unified and markdown-it ecosystems.

A markdown-it plugin for the `abbr` syntax extension.

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
npm install @saeris/mdit-abbr
```

### Standalone

```ts
import MarkdownIt from "markdown-it";
import { abbr } from "@saeris/mdit-abbr";

const md = new MarkdownIt().use(abbr);
```

### VitePress

```ts
// .vitepress/config.ts
import { defineConfig } from "vitepress";
import { abbr } from "@saeris/mdit-abbr";

export default defineConfig({
  markdown: {
    config: (md) => md.use(abbr)
  }
});
```

## Documentation

Full documentation, more examples, and configuration options: [saeris.github.io/markdown/guide/plugins/abbr](https://saeris.github.io/markdown/guide/plugins/abbr)

## License

MIT © [Drake Costa](https://saeris.gg)
