# @saeris/mdit-del

> Part of [`@saeris/markdown`](https://github.com/saeris/markdown) — a suite of markdown syntax extensions for the unified and markdown-it ecosystems.

A markdown-it plugin for the `del` syntax extension.

## Overview

The `del` plugin renders `--text--` as an HTML `<del>` element, representing deleted or struck-through text.

```html
<del>text</del>
```

## Syntax

Wrap text in double dashes to mark it as deleted:

```markdown
--This text has been deleted.--

You can use it inline: the price was --$50-- $35.
```

## Usage

## Install

```sh
npm install @saeris/mdit-del
```

### Standalone

```ts
import MarkdownIt from "markdown-it";
import { del } from "@saeris/mdit-del";

const md = new MarkdownIt().use(del);
```

### VitePress

```ts
// .vitepress/config.ts
import { defineConfig } from "vitepress";
import { del } from "@saeris/mdit-del";

export default defineConfig({
  markdown: {
    config: (md) => md.use(del)
  }
});
```

## Documentation

Full documentation, more examples, and configuration options: [saeris.github.io/markdown/guide/plugins/del](https://saeris.github.io/markdown/guide/plugins/del)

## License

MIT © [Drake Costa](https://saeris.gg)
