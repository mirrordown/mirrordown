# @mirrordown/sat-kbd

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified, markdown-it and Sätteri ecosystems.

A Sätteri plugin for the `kbd` syntax extension.

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

> [!NOTE]
> Formatting that crosses a key's brackets, such as `[[*a]]*`, renders differently by engine: markdown-it reads the key first, while remark and Sätteri have already read the emphasis when the plugin runs. Keep formatting inside or outside the brackets.

## Install

```sh
npm install @mirrordown/sat-kbd
```

Leave Sätteri's `wikilinks` feature off: it reads `[[…]]` as a link first.

### Standalone

```ts
import { markdownToHtml } from "satteri";
import { satteriKbd } from "@mirrordown/sat-kbd";

const { html } = markdownToHtml(source, {
  mdastPlugins: [satteriKbd()],
});
```

### Astro

```ts
// astro.config.ts
import { defineConfig } from "astro/config";
import { satteri } from "@astrojs/markdown-satteri";
import { satteriKbd } from "@mirrordown/sat-kbd";

export default defineConfig({
  markdown: {
    processor: satteri({ mdastPlugins: [satteriKbd()] }),
  },
});
```

## Documentation

Full documentation, more examples, and configuration options: [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown) (dedicated docs site coming soon).

## License

MIT © [Drake Costa](https://saeris.gg)
