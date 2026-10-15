# @mirrordown/sat-ins

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified, markdown-it and Sätteri ecosystems.

A Sätteri plugin for the `ins` syntax extension.

## Overview

The `ins` plugin renders `++text++` as an HTML `<ins>` element, representing inserted or added text.

```html
<ins>text</ins>
```

## Syntax

Wrap text in double plus signs to mark it as inserted:

````markdown
++This text has been inserted.++

You can use it inline: the price is now ++$35++ (was $50).
````

## Install

```sh
npm install @mirrordown/sat-ins
```

### Standalone

```ts
import { markdownToHtml } from "satteri";
import { satteriIns } from "@mirrordown/sat-ins";

const { html } = markdownToHtml(source, {
  mdastPlugins: [satteriIns()],
});
```

### Astro

```ts
// astro.config.ts
import { defineConfig } from "astro/config";
import { satteri } from "@astrojs/markdown-satteri";
import { satteriIns } from "@mirrordown/sat-ins";

export default defineConfig({
  markdown: {
    processor: satteri({ mdastPlugins: [satteriIns()] }),
  },
});
```

## Documentation

Full documentation, more examples, and configuration options: [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown) (dedicated docs site coming soon).

## License

MIT © [Drake Costa](https://saeris.gg)
