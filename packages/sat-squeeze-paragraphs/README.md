# @mirrordown/sat-squeeze-paragraphs

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified, markdown-it and Sätteri ecosystems.

A Sätteri plugin for the `squeeze-paragraphs` syntax extension.

## Overview

The `squeeze-paragraphs` plugin removes paragraphs that are empty or contain only whitespace. A paragraph counts as empty when it has no children, or when every child is whitespace-only text. Whitespace means the characters HTML ignores between elements (space, tab, line feed, form feed and carriage return): a paragraph holding only a no-break space (`&nbsp;`) or another Unicode space is deliberate content and is kept. An empty paragraph is removed even if it carries attributes, such as an `id` or a `class`, and they are dropped with it.

Markdown has one way to write such a paragraph by hand: whitespace written as character references, such as `&#32;` alone between two blank lines, and the plugin removes that too. Otherwise it does nothing to hand-written Markdown. Its job is to run **after** other transforms that can leave an empty `<p>` behind — for example a comment stripper that removes a paragraph's only content, or a plugin that lifts an element out of its wrapping paragraph. Adding `squeeze-paragraphs` last tidies up that residue.

**Before** (a prior transform emptied the middle paragraph):
```html
<p>Kept.</p>
<p></p>
<p>Also kept.</p>
```

**After:**
```html
<p>Kept.</p>
<p>Also kept.</p>
```

## Syntax

There is no syntax and no visible change for normal Markdown — paragraphs with real content are always preserved:

````markdown
A paragraph with text.

A paragraph with *emphasis* and an image ![icon](https://picsum.photos/16/16) is not empty either.
````

> [!NOTE]
> Apart from a paragraph of whitespace character references (`&#32;`), empty paragraphs cannot be written directly in Markdown, so the removal behaviour mostly shows up when another plugin produces one. Place `squeeze-paragraphs` last in your pipeline so it sees that residue.

Two things differ between the engines:

- With markdown-it's `breaks: true`, a line ending inside a paragraph renders as a `<br>`, so a paragraph of whitespace over several lines (`&#32;` on two lines running) is kept there, and removed without the option. A hard break (two spaces or a backslash before the line ending) keeps the paragraph in every engine.
- In a tight list item there is no `<p>` to remove in remark and Sätteri, so `- &#32;` keeps its space inside the `<li>`, where markdown-it leaves the item empty.

> [!NOTE]
> For remark, this is a rehype plugin (`rehype-*`), not a remark plugin: add it **after** `remarkRehype`. In every engine, add it after any plugin whose residue it should clean up.

## Install

```sh
npm install @mirrordown/sat-squeeze-paragraphs
```

List it last among your hast plugins, so it sees the residue the others leave.

### Standalone

```ts
import { markdownToHtml } from "satteri";
import { satteriSqueezeParagraphs } from "@mirrordown/sat-squeeze-paragraphs";

const { html } = markdownToHtml(source, {
  hastPlugins: [satteriSqueezeParagraphs()],
});
```

### Astro

```ts
// astro.config.ts
import { defineConfig } from "astro/config";
import { satteri } from "@astrojs/markdown-satteri";
import { satteriSqueezeParagraphs } from "@mirrordown/sat-squeeze-paragraphs";

export default defineConfig({
  markdown: {
    processor: satteri({ hastPlugins: [satteriSqueezeParagraphs()] }),
  },
});
```

## Documentation

Full documentation, more examples, and configuration options: [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown) (dedicated docs site coming soon).

## License

MIT © [Drake Costa](https://saeris.gg)
