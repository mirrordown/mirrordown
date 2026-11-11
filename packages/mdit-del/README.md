# @mirrordown/mdit-del

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified, markdown-it and Sätteri ecosystems.

A markdown-it plugin for the `del` syntax extension.

## Overview

The `del` plugin renders `--text--` as an HTML `<del>` element, representing deleted or struck-through text.

```html
<del>text</del>
```

## Syntax

Wrap text in double dashes to mark it as deleted:

````markdown
--This text has been deleted.--

You can use it inline: the price was --$50-- $35.
````

> [!NOTE]
> Smart punctuation rewrites `--` as an en dash before this plugin sees it, and Astro turns it on by default (`smartypants` for remark, `smartPunctuation` for Sätteri). Turn it off, or use a Mirrordown preset, which does.

A backslash keeps a delimiter literal (`\--not deleted--`), and so does writing a dash as a character reference (`&#45;`). A few things differ between the engines:

- Spans have to nest. When a span crosses another one or crosses emphasis (`--a *b-- c*`, `--a ++b-- c++`), each engine resolves it its own way, and in remark and Sätteri the result depends on the order the plugins are listed in.
- In image alt text (`![--a--](x.png)`), markdown-it drops the dashes and remark and Sätteri keep the text as written.
- The remark plugin reads escapes from the source, so it needs the file: `processor.runSync(tree)` on a tree alone treats `\--` as `--`.

## Install

```sh
npm install @mirrordown/mdit-del
```

### Standalone

```ts
import MarkdownIt from "markdown-it";
import { del } from "@mirrordown/mdit-del";

const md = new MarkdownIt().use(del);
```

### VitePress

```ts
// .vitepress/config.ts
import { defineConfig } from "vitepress";
import { del } from "@mirrordown/mdit-del";

export default defineConfig({
  markdown: {
    config: (md) => md.use(del),
  },
});
```

## Documentation

Full documentation, more examples, and configuration options: [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown) (dedicated docs site coming soon).

## License

MIT © [Drake Costa](https://saeris.gg)
