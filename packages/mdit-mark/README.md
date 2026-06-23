# @saeris/mdit-mark

> Part of [`@saeris/markdown`](https://github.com/saeris/markdown) — a suite of markdown syntax extensions for the unified and markdown-it ecosystems.

A markdown-it plugin for the `mark` syntax extension.

## Overview

The `mark` plugin renders `==text==` as an HTML `<mark>` element, representing highlighted or marked text.

```html
<mark>text</mark>
```

## Syntax

Wrap text in double equals signs to highlight it:

```markdown
==This text is highlighted.==

You can use it inline: remember to ==save your work== before closing.
```

## Usage

## Install

```sh
npm install @saeris/mdit-mark
```

### Standalone

```ts
import MarkdownIt from "markdown-it";
import { mark } from "@saeris/mdit-mark";

const md = new MarkdownIt().use(mark);
```

### VitePress

```ts
// .vitepress/config.ts
import { defineConfig } from "vitepress";
import { mark } from "@saeris/mdit-mark";

export default defineConfig({
  markdown: {
    config: (md) => md.use(mark)
  }
});
```

## Documentation

Full documentation, more examples, and configuration options: [saeris.github.io/markdown/guide/plugins/mark](https://saeris.github.io/markdown/guide/plugins/mark)

## License

MIT © [Drake Costa](https://saeris.gg)
