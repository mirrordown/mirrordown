# @mirrordown/mdit-image-size

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified, markdown-it and Sätteri ecosystems.

A markdown-it plugin for the `image-size` syntax extension.

## Overview

The `image-size` plugin reads an image's size from its description, the way Obsidian does, and writes it as the image's `width` and `height` attributes. The rest of the description stays the alt text.

```markdown
![Engelbart|100x145](https://example.com/e.jpg)
```

```html
<img src="https://example.com/e.jpg" alt="Engelbart" width="100" height="145">
```

In renderers without the plugin, the image still shows, with the size left in its alt text (`alt="Engelbart|100x145"`).

## Syntax

End the description with `|`, a width, and optionally `x` and a height. The text before the `|` is the alt text.

````markdown
![Mount Fuji at dawn|300x200](./assets/fuji.jpg)
````

Give a width alone and the height follows the image's own proportions:

````markdown
![A dock on a still lake|300](./assets/dock.jpg)
````

A description that is only a size (`240` or `240x160`) sizes the image and leaves its alt text empty, which marks the image as decoration:

````markdown
![240](./assets/sapling.jpg)
````

A reference image is sized the same way, `![Engelbart|100][portrait]`, and finds its definition by its own label. A collapsed or shortcut reference (`![Engelbart|100][]`, `![Engelbart|100]`) has none but the description, so its definition is written with the size: `[Engelbart|100]: e.jpg`.

### What is a size

A width and a height are each one to five ASCII digits, not starting with `0`, and the `x` between them is lower case. Nothing else is a size, and a description that does not end in one is left as it is:

| Description | Why it is not a size |
| --- | --- |
| `a\|100px`, `a\|50%` | a unit |
| `a\|x145` | no width |
| `a\|100x` | an `x` without a height |
| `a\|100X145` | an upper-case `X` |
| `a\|0`, `a\|0100` | starts with `0` |
| `a\|123456` | six digits |
| `a\|100 x 145`, `a\| 100` | a space inside |
| `a\|100 ` | a space after it |

Only the last `|` is read: `![a|b|100](…)` has the alt text `a|b`. The alt text loses the whitespace before the `|` (`![Engelbart |100](…)` has the alt text `Engelbart`).

### The description is its text

The size is read from the alt text, which is the description as plain text in every engine: formatting is dropped and code spans, escapes and character references are their text. So `![*Engel*bart|100](…)` has the alt text `Engelbart`, and a `|` is a `|` however it is written: `\|` and `&#124;` read as the bar too.

That is what makes a size work in a table cell, where a bare `|` ends the cell: write the bar escaped there.

````markdown
| Photo | Place |
| --- | --- |
| ![A swan\|48](./assets/swan-thumb.jpg) | The lake |
````

It is also the cost: there is no way to write an alt text that ends in `|` and a number, or that is only a number, as such text is always read as a size.

### Attribute blocks

With the [`attrs`](/guide/plugins/attrs) plugin, or Sätteri's `attributes` feature, a `width` or `height` written in a block wins over the description's, each on its own: `![a|100x145](…){width=50}` has `width="50"` and `height="145"`. The size is written after the image's `src`, `alt` and `title`, and the block's other attributes after the size.

### Other image plugins

- A [lightbox](/guide/plugins/lightbox) image (`!![a|100](…)`) has the size in both places it shows: the thumbnail and the image in the dialog. Two sizes of one image share a dialog, which shows the first.
- [Captions](/guide/plugins/caption), [spoilers](/guide/plugins/spoiler) and [unwrap-images](/guide/plugins/unwrap-images) take a sized image like any other.
- [inline-svg](/guide/plugins/inline-svg) replaces an `.svg` image with the file's own `<svg>`, which keeps the size written in the file: the description's size is lost, and the alt text without it names the SVG.
- A [spoiler](/guide/plugins/spoiler) written inside a description (`![a ||b|| c|100](…)`) differs by engine, as in any alt text: markdown-it drops its pipes and remark and Sätteri keep them. The size is read in all three.
- With the [ruby](/guide/plugins/ruby) plugin, a sized image cannot be a ruby's base: the ruby reads the first `|` inside its braces as its separator, so `{![a|100](…)|reading}` splits inside the image. A sized image in a ruby's reading (`{base|![a|100](…)}`) is sized.

Obsidian's embeds, `![[image.png|100]]`, are a different syntax and not part of this plugin.

## What a host does with the size

The plugin only writes the two attributes: it does not change the `src`, write a `srcset` or ship a stylesheet. The attributes are what a host's image pipeline reads:

- **Astro** passes every attribute of a Markdown image to its image pipeline, in both of its Markdown processors, and resizes the image to them at build time. A remote image needs its host in `image.domains` or `image.remotePatterns` to be processed.
- **A plain page** uses them to reserve the image's space before it loads, so the text does not jump. When only a width is given, keep `height: auto` in the page's CSS, so the height follows the image's own proportions.

> [!NOTE]
> In remark and Sätteri, list the plugin after the plugins that make image nodes, a prompt's preview ([prompt](/guide/plugins/prompt)) and a ruby's reading ([ruby](/guide/plugins/ruby)), so it sizes theirs too. In Sätteri, list it before the [alerts](/guide/plugins/github-alerts) plugin, which reads an image's alt into a title's label when it runs. In markdown-it the order does not matter, but for one case: add it before the attrs plugin, or a `title` written in an attribute block comes before the size.

## Install

```sh
npm install @mirrordown/mdit-image-size
```

### Standalone

```ts
import MarkdownIt from "markdown-it";
import { imageSize } from "@mirrordown/mdit-image-size";

const md = new MarkdownIt().use(imageSize);
```

### VitePress

```ts
// .vitepress/config.ts
import { defineConfig } from "vitepress";
import { imageSize } from "@mirrordown/mdit-image-size";

export default defineConfig({
  markdown: {
    config: (md) => md.use(imageSize),
  },
});
```

## Documentation

Full documentation, more examples, and configuration options: [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown) (dedicated docs site coming soon).

## License

MIT © [Drake Costa](https://saeris.gg)
