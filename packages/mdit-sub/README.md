# @mirrordown/mdit-sub

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified and markdown-it ecosystems.

A markdown-it plugin for the `sub` syntax extension.

## Overview

The `sub` plugin renders `~text~` as an HTML `<sub>` element, representing subscript text.

```html
<sub>text</sub>
```

## Syntax

Wrap text in single tildes to render it as subscript:

````markdown
The chemical formula for water is H~2~O.

Carbon dioxide is CO~2~.
````

### Formatting inside

The content is inline markup, like emphasis: it can hold spaces, other formatting and superscript, but can't start or end with a space.

````markdown
x~n^2^~ and the ~*base* index~
````

## Install

```sh
npm install @mirrordown/mdit-sub
```

### Standalone

```ts
import MarkdownIt from "markdown-it";
import { sub } from "@mirrordown/mdit-sub";

const md = new MarkdownIt().use(sub);
```

### VitePress

```ts
// .vitepress/config.ts
import { defineConfig } from "vitepress";
import { sub } from "@mirrordown/mdit-sub";

export default defineConfig({
  markdown: {
    config: (md) => md.use(sub),
  },
});
```

## Documentation

Full documentation, more examples, and configuration options: [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown) (dedicated docs site coming soon).

## License

MIT © [Drake Costa](https://saeris.gg)
