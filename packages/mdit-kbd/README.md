# @mirrordown/mdit-kbd

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified and markdown-it ecosystems.

A markdown-it plugin for the `kbd` syntax extension.

## Overview

The `kbd` plugin renders `[[key]]` as an HTML `<kbd>` element, representing keyboard input or a key name.

```html
<kbd>key</kbd>
```

## Syntax

Wrap a key name in double square brackets:

````markdown
Press [[Enter]] to confirm.

You can combine multiple keys: [[Ctrl]] + [[Shift]] + [[P]] opens the command palette.
````

## Install

```sh
npm install @mirrordown/mdit-kbd
```

### Standalone

```ts
import MarkdownIt from "markdown-it";
import { kbd } from "@mirrordown/mdit-kbd";

const md = new MarkdownIt().use(kbd);
```

### VitePress

```ts
// .vitepress/config.ts
import { defineConfig } from "vitepress";
import { kbd } from "@mirrordown/mdit-kbd";

export default defineConfig({
  markdown: {
    config: (md) => md.use(kbd),
  },
});
```

## Documentation

Full documentation, more examples, and configuration options: [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown) (dedicated docs site coming soon).

## License

MIT © [Drake Costa](https://saeris.gg)
