# @mirrordown/mdit-kbd

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified, markdown-it and Sätteri ecosystems.

A markdown-it plugin for the `kbd` syntax extension.

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

A key holds inline content on one line: a code span, an autolink or a link inside it is one unit, so a `]]` inside a code span does not close the key, and a line break before the closing `]]` leaves the text as it is. Keys nest up to 100 deep; deeper brackets stay text. A backslash keeps a bracket literal (`\[[not a key]]`), and so does writing it as a character reference (`&#91;`).

Where the brackets could also be read as a link, the key wins: `[[Enter]]` is a key even when the document defines `[Enter]: …`, and `[[a]](url)` is a key followed by `(url)`. A few things differ between the engines:

- When a key shares its opening brackets with a link (`[[a](url)]]`), markdown-it parses what is left of the link syntax again, while remark and Sätteri show it as written. A character reference or formatting in that leftover, or a reference link with more link syntax straight after it (`[[a][ref](url)`), renders differently.
- In image alt text (`![[[a]]](pic.png)`), markdown-it drops the brackets and remark and Sätteri keep the text as written.

## Install

```sh
npm install @mirrordown/mdit-kbd
```

### Standalone

```ts
import MarkdownIt from "markdown-it";
import { kbd } from "@mirrordown/mdit-kbd";

const md = new MarkdownIt().use(kbd);
```

### VitePress

```ts
// .vitepress/config.ts
import { defineConfig } from "vitepress";
import { kbd } from "@mirrordown/mdit-kbd";

export default defineConfig({
  markdown: {
    config: (md) => md.use(kbd),
  },
});
```

## Documentation

Full documentation, more examples, and configuration options: [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown) (dedicated docs site coming soon).

## License

MIT © [Drake Costa](https://saeris.gg)
