# @mirrordown/mdit-sup

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified and markdown-it ecosystems.

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

### Formatting inside

The content is inline markup, like emphasis: it can hold spaces, other formatting and subscript, but can't start or end with a space.

```markdown
e^x~0~^ and the ^*n*th power^
```

## Install

```sh
npm install @mirrordown/mdit-sup
```

### Standalone

```ts
import MarkdownIt from "markdown-it";
import { sup } from "@mirrordown/mdit-sup";

const md = new MarkdownIt().use(sup);
```

### VitePress

```ts
// .vitepress/config.ts
import { defineConfig } from "vitepress";
import { sup } from "@mirrordown/mdit-sup";

export default defineConfig({
  markdown: {
    config: (md) => md.use(sup)
  }
});
```

## Documentation

Full documentation, more examples, and configuration options: [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown) (dedicated docs site coming soon).

## License

MIT © [Drake Costa](https://saeris.gg)
