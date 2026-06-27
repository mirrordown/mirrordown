# Markdown Inline SVG

Inline SVG images in VSCode's markdown preview.

## Overview

Any Markdown image that points to a local `.svg` file is replaced inline with the
SVG's own markup in the preview — so it renders as a true vector element you can
theme and style, instead of a flat `<img>`.

Unlike the other extensions in this family, this one runs as a small preview
script rather than a markdown-it plugin: it finds `<img src="….svg">` in the
rendered preview and swaps each one for its inlined `<svg>`.

## Syntax

Reference a local SVG as you would any image:

```markdown
![A diagram](./diagram.svg)
```

In the preview the `<img>` becomes an inline `<svg>`. The image's `alt`, `class`,
and inline `style` carry over to the `<svg>` element — handy for sizing or
theming (the `alt` becomes an `aria-label`):

```markdown
![Logo](./logo.svg){ .icon style="width: 1.5rem" }
```

> The `{ … }` attribute syntax above is provided by the companion
> **Markdown Attrs** extension.

## About

Part of **[Markdown Preview Extended Syntax](https://marketplace.visualstudio.com/items?itemName=saeris.markdown-preview-extended-syntax)** — a pack of Markdown preview syntax extensions you can install all at once.

Source on [GitHub](https://github.com/mirrordown/mirrordown).
