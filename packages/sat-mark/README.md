# @mirrordown/sat-mark

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified, markdown-it and Sätteri ecosystems.

A Sätteri plugin for the `mark` syntax extension.

## Overview

The `mark` plugin renders `==text==` as an HTML `<mark>` element, representing highlighted or marked text.

```html
<mark>text</mark>
```

## Syntax

Wrap text in double equals signs to highlight it:

````markdown
==This text is highlighted.==

You can use it inline: remember to ==save your work== before closing.
````

## Install

```sh
npm install @mirrordown/sat-mark
```

### Standalone

```ts
import { markdownToHtml } from "satteri";
import { satteriMark } from "@mirrordown/sat-mark";

const { html } = markdownToHtml(source, {
  mdastPlugins: [satteriMark()],
});
```

### Astro

```ts
// astro.config.ts
import { defineConfig } from "astro/config";
import { satteri } from "@astrojs/markdown-satteri";
import { satteriMark } from "@mirrordown/sat-mark";

export default defineConfig({
  markdown: {
    processor: satteri({ mdastPlugins: [satteriMark()] }),
  },
});
```

## Documentation

Full documentation, more examples, and configuration options: [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown) (dedicated docs site coming soon).

## License

MIT © [Drake Costa](https://saeris.gg)
