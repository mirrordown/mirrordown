# @saeris/mdit-sup

> Part of [`@saeris/markdown`](https://github.com/saeris/markdown) — a suite of markdown syntax extensions for the unified and markdown-it ecosystems.

A markdown-it plugin for the `sup` syntax extension.

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
npm install @saeris/mdit-sup
```

### Standalone

```ts
import MarkdownIt from "markdown-it";
import { sup } from "@saeris/mdit-sup";

const md = new MarkdownIt().use(sup);
```

### VitePress

```ts
// .vitepress/config.ts
import { defineConfig } from "vitepress";
import { sup } from "@saeris/mdit-sup";

export default defineConfig({
  markdown: {
    config: (md) => md.use(sup)
  }
});
```

## Documentation

Full documentation, more examples, and configuration options: [saeris.github.io/markdown/guide/plugins/sup](https://saeris.github.io/markdown/guide/plugins/sup)

## License

MIT © [Drake Costa](https://saeris.gg)
