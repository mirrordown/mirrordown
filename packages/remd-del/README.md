# @mirrordown/remd-del

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified, markdown-it and Sätteri ecosystems.

A remark/rehype (unified) plugin for the `del` syntax extension.

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
> Smart punctuation rewrites `--` as an en dash before this plugin sees it, and Astro turns it on by default (`smartypants` for remark, `smartPunctuation` for Sätteri). Turn it off, or use a Mirrordown preset, which does. With it off, two `--` used as dashes on one line pair up: `2020--2021 and 2022--2023` strikes out `2021 and 2022`. Escape one of them (`2020\--2021`).

A delimiter needs text right against it, as emphasis does: an opening `--` can't be followed by a space and a closing one can't follow a space, so `a -- b -- c` stays as written. Of a run of three, one dash stays outside (`---a---` is a deletion between two dashes). A deletion can run over a line break, not over a blank line. A URL written bare in the text is read like any other text, also where GFM makes it a link (`https://example.com/a--b--c` strikes out the `b`): write it as an autolink (`<https://…>`) or as a link's target to keep it whole.

A backslash keeps a delimiter literal (`\--not deleted--`), and so does writing a dash as a character reference (`&#45;`). Deletions nest up to 100 deep; the markers of deeper ones stay text. An attribute block written right after a deletion (`--text--{.name}`) goes on the `<del>`, with the [`attrs`](/guide/plugins/attrs) plugin or Sätteri's `attributes` feature on. A few things differ between the engines:

- Spans have to nest. When a span crosses another one or crosses emphasis (`--a *b-- c*`, `--a ++b-- c++`), each engine resolves it its own way, and in remark and Sätteri the result depends on the order the plugins are listed in.
- In image alt text (`![--a--](x.png)`), markdown-it drops the dashes and remark and Sätteri keep the text as written.
- The remark plugin reads escapes from the source, so it needs the file: `processor.runSync(tree)` on a tree alone treats `\--` as `--`.

## Install

```sh
npm install @mirrordown/remd-del
```

### Unified

```ts
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { remarkDel } from "@mirrordown/remd-del";

const processor = unified()
  .use(remarkParse)
  .use(remarkDel)
  .use(remarkRehype)
  .use(rehypeStringify);
```

### Astro

```ts
// astro.config.ts
import { defineConfig } from "astro/config";
import { remarkDel } from "@mirrordown/remd-del";

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkDel],
  },
});
```

## Documentation

Full documentation, more examples, and configuration options: [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown) (dedicated docs site coming soon).

## License

MIT © [Drake Costa](https://saeris.gg)
