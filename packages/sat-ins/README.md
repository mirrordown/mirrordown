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

A delimiter needs text right against it, as emphasis does: an opening `++` can't be followed by a space and a closing one can't follow a space, so `a ++ b ++ c` stays as written. Of a run of three, one plus stays outside (`+++a+++` is an insertion between two plus signs). An insertion can run over a line break, not over a blank line. A URL written bare in the text is read like any other text, also where GFM makes it a link (`https://example.com/a++b++c` marks the `b`): write it as an autolink (`<https://…>`) or as a link's target to keep it whole.

A backslash keeps a delimiter literal (`\++not inserted++`), and so does writing a plus as a character reference (`&#43;`). Insertions nest up to 100 deep; the markers of deeper ones stay text. An attribute block written right after an insertion (`++text++{.name}`) goes on the `<ins>`, with the [`attrs`](/guide/plugins/attrs) plugin or Sätteri's `attributes` feature on. A few things differ between the engines:

- Spans have to nest. When a span crosses another one or crosses emphasis (`++a *b++ c*`, `++a --b++ c--`), each engine resolves it its own way, and in remark and Sätteri the result depends on the order the plugins are listed in.
- In image alt text (`![++a++](x.png)`), markdown-it drops the plus signs and remark and Sätteri keep the text as written.
- The remark plugin reads escapes from the source, so it needs the file: `processor.runSync(tree)` on a tree alone treats `\++` as `++`.

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
