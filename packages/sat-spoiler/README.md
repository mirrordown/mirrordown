# @mirrordown/sat-spoiler

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified, markdown-it and Sätteri ecosystems.

A Sätteri plugin for the `spoiler` syntax extension.

## Overview

The `spoiler` plugin hides content behind a click-to-reveal cover using Discord's `||…||` syntax. Wrap inline content in double pipes — `||the butler did it||` — and it renders as an obscured bar; click it (or focus it and press <kbd>Space</kbd>) to reveal the text in place. Wrap an image and it renders blurred with a centered **SPOILER** label, like Discord's image spoilers.

The entire interaction is built from HTML and CSS only — a `<label>` wrapping a visually-hidden checkbox and the content, revealed with the `:checked` sibling selector. **No JavaScript runs**, so it works in environments that disable scripts, such as the VSCode Markdown preview.

```html
<label class="markdown-spoiler">
  <input type="checkbox" class="markdown-spoiler-toggle" aria-label="spoiler" />
  <span class="markdown-spoiler-content">the butler did it</span>
</label>
```

The checkbox is the only interactive control, so it stays keyboard-operable and is announced by screen readers as a spoiler control. The stylesheet hides text by making it transparent on the bar, and hides elements inside the spoiler (emphasis, links, code) with `visibility: hidden`: plain text stays in the page, so it is hidden from sight and not necessarily from a screen reader.

## Syntax

Wrap any inline content in `||…||`. Click a bar below to reveal it; click again to hide it.

````markdown
The killer was ||the butler|| all along, hidden in ||the conservatory||.
````

In renderers without the plugin, `||…||` renders as plain text.

A backslash keeps a delimiter literal (`\||not hidden||`), and so does writing a pipe as a character reference (`&#124;`). A table cell is the exception: a pipe there has to be written `\|`, so a spoiler in a cell is written `\|\|hidden\|\|`.

Spans have to nest. When a spoiler crosses another span or crosses emphasis (`||a *b|| c*`), each engine resolves it its own way, and in remark and Sätteri the result depends on the order the plugins are listed in. Spoilers nest up to 50 deep; the pipes of deeper ones stay text.

A spoiler takes no attributes: with the [`attrs`](/guide/plugins/attrs) plugin or Sätteri's `attributes` feature on, an attribute block written right after one (`||text||{.name}`) is read and dropped in every engine.

A few things differ between the engines:

- In image alt text (`![||a||](x.png)`), markdown-it drops the pipes and remark and Sätteri keep the text as written.
- The remark plugin reads escapes from the source, so it needs the file: `processor.runSync(tree)` on a tree alone treats `\||` as `||`.
- In a table cell, two backslashes before a pipe (`\\|`) are a backslash and an escaped pipe to markdown-it, and an escaped backslash and a cell separator to remark and Sätteri, so a row holding them splits into cells differently before any plugin runs.

### Rich inline content

A spoiler can wrap any inline markup — emphasis, code, links — and it stays obscured until revealed. One exception today: with the [`ruby`](/guide/plugins/ruby) plugin on, braces around text that holds a spoiler are read as a ruby, whose first `|` is its separator, so `{note: ||secret||}` renders `note:` with `|secret||` printed above it. A long spoiler wraps across lines with each line getting its own bar, just like Discord.

````markdown
The recipe needs ||**two** cups of `flour` and a
[secret ingredient](https://example.com) that nobody expects||.
````

### Image spoilers

Wrap an image to hide it behind a blur and a **SPOILER** label — Discord's treatment for spoilered image embeds. Clicking reveals the sharp image.

````markdown
Careful, dinner photo incoming: ||![A young sapling](./assets/sapling.jpg "Sapling")||
````

### Spoilered, zoomable images

Combine with the [`lightbox`](/guide/plugins/lightbox) plugin (`||!![…]()||`) for a spoilered image that is also click-to-zoom once revealed. The zoom button sits inside the spoiler and can take keyboard focus of its own, so today <kbd>Tab</kbd> then <kbd>Enter</kbd> opens the image without revealing it first.

````markdown
The reveal: ||!![Mount Fuji at dawn](./assets/fuji.jpg "Mount Fuji")||
````

### Inside links

A spoiler works inside a link — the whole revealed content remains the link target. The markup puts the spoiler's `<label>` and checkbox inside the `<a>`.

````markdown
Read [the ||shocking twist||](https://example.com) at your own risk.
````

## Accessibility

The spoiler is a real checkbox with `aria-label="spoiler"`, so assistive technology announces it as a control the user can operate. Keyboard users <kbd>Tab</kbd> to the spoiler and press <kbd>Space</kbd> to reveal it; a focus ring marks the current spoiler. Revealing is reversible (unlike Discord, which locks open) — a superset of the expected behavior.

## Customization

The stylesheet keeps its rules in `@layer markdown-spoiler`, so any unlayered CSS you write overrides them without `!important`. The common knobs are exposed as custom properties — set them on `:root` or any ancestor:

| Property                            | Default                                     | Description                             |
| ----------------------------------- | ------------------------------------------- | --------------------------------------- |
| `--markdown-spoiler-bar`            | `#202225`                                   | Obscured bar color (text spoilers).     |
| `--markdown-spoiler-bar-hover`      | `--markdown-spoiler-bar` mixed 15% white    | Bar color under the pointer.            |
| `--markdown-spoiler-radius`         | `0.25rem`                                   | Bar corner radius.                      |
| `--markdown-spoiler-duration`       | `0.15s`                                     | Reveal transition duration.             |
| `--markdown-spoiler-revealed`       | `color-mix(in srgb, currentColor 8%, …)`    | Background behind revealed text.        |
| `--markdown-spoiler-media-blur`     | `2.5rem`                                     | Blur radius for image spoilers.         |
| `--markdown-spoiler-label`          | `"SPOILER"`                                 | Text of the image-spoiler pill.         |

```css
:root {
  --markdown-spoiler-bar: #111;
  --markdown-spoiler-radius: 0.5rem;
  --markdown-spoiler-label: "HIDDEN";
}
```

## Browser support

Text spoilers work everywhere (checkbox + sibling selector). Image spoilers use [`:has()`](https://developer.mozilla.org/docs/Web/CSS/:has) to detect media and [`box-decoration-break`](https://developer.mozilla.org/docs/Web/CSS/box-decoration-break) for per-line bars (Chromium 105+, Safari, Firefox 122+); where unsupported, an image spoiler still hides its content, just without the per-line polish.

## Install

```sh
npm install @mirrordown/sat-spoiler
```

With Sätteri's `attributes` feature on, a table cell that holds a spoiler takes no attribute block of its own: the parser reads none in a cell with an escaped pipe, so `| \|\|hidden\|\| {.name} |` keeps ` {.name}` as text.

### Standalone

```ts
import { markdownToHtml } from "satteri";
import { satteriSpoiler } from "@mirrordown/sat-spoiler";
import "@mirrordown/sat-spoiler/spoiler.css";

const { html } = markdownToHtml(source, {
  mdastPlugins: [satteriSpoiler()],
});
```

### Astro

```ts
// astro.config.ts
import { defineConfig } from "astro/config";
import { satteri } from "@astrojs/markdown-satteri";
import { satteriSpoiler } from "@mirrordown/sat-spoiler";

export default defineConfig({
  markdown: {
    processor: satteri({ mdastPlugins: [satteriSpoiler()] }),
  },
});

// In your layout:
import "@mirrordown/sat-spoiler/spoiler.css";
```

## Documentation

Full documentation, more examples, and configuration options: [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown) (dedicated docs site coming soon).

## License

MIT © [Drake Costa](https://saeris.gg)
