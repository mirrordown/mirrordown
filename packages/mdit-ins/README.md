# @saeris/mdit-ins

> Part of [`@saeris/markdown`](https://github.com/saeris/markdown) — a suite of markdown syntax extensions for the unified and markdown-it ecosystems.

A markdown-it plugin for the `ins` syntax extension.

## Overview

The `ins` plugin renders `++text++` as an HTML `<ins>` element, representing inserted or added text.

```html
<ins>text</ins>
```

## Syntax

Wrap text in double plus signs to mark it as inserted:

```markdown
++This text has been inserted.++

You can use it inline: the price is now ++$35++ (was $50).
```

## Usage

## Install

```sh
npm install @saeris/mdit-ins
```

### Standalone

```ts
import MarkdownIt from "markdown-it";
import { ins } from "@saeris/mdit-ins";

const md = new MarkdownIt().use(ins);
```

### VitePress

```ts
// .vitepress/config.ts
import { defineConfig } from "vitepress";
import { ins } from "@saeris/mdit-ins";

export default defineConfig({
  markdown: {
    config: (md) => md.use(ins)
  }
});
```

## Documentation

Full documentation, more examples, and configuration options: [saeris.github.io/markdown/guide/plugins/ins](https://saeris.github.io/markdown/guide/plugins/ins)

## License

MIT © [Drake Costa](https://saeris.gg)
