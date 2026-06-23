# @saeris/mdit-sub

> Part of [`@saeris/markdown`](https://github.com/saeris/markdown) — a suite of markdown syntax extensions for the unified and markdown-it ecosystems.

A markdown-it plugin for the `sub` syntax extension.

## Overview

The `sub` plugin renders `~text~` as an HTML `<sub>` element, representing subscript text.

```html
<sub>text</sub>
```

## Syntax

Wrap text in single tildes to render it as subscript:

```markdown
The chemical formula for water is H~2~O.

Carbon dioxide is CO~2~.
```

## Usage

## Install

```sh
npm install @saeris/mdit-sub
```

### Standalone

```ts
import MarkdownIt from "markdown-it";
import { sub } from "@saeris/mdit-sub";

const md = new MarkdownIt().use(sub);
```

### VitePress

```ts
// .vitepress/config.ts
import { defineConfig } from "vitepress";
import { sub } from "@saeris/mdit-sub";

export default defineConfig({
  markdown: {
    config: (md) => md.use(sub)
  }
});
```

## Documentation

Full documentation, more examples, and configuration options: [saeris.github.io/markdown/guide/plugins/sub](https://saeris.github.io/markdown/guide/plugins/sub)

## License

MIT © [Drake Costa](https://saeris.gg)
