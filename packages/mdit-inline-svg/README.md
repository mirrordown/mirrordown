# @mirrordown/mdit-inline-svg

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified and markdown-it ecosystems.

A markdown-it plugin that inlines referenced SVG images directly into the rendered output.

## Overview

The `inline-svg` plugin replaces image references that point at `.svg` files with the SVG markup itself, so icons render as inline `<svg>` elements instead of `<img>` tags — stylable with CSS and free of an extra network request. SVGs are read from disk, optionally optimized with [SVGO](https://github.com/svg/svgo), and can be deduplicated when the same icon appears many times.

```markdown
![star](./icons/star.svg)
```

renders the contents of `star.svg` inline rather than `<img src="./icons/star.svg">`.

## Install

```sh
npm install @mirrordown/mdit-inline-svg
```

## Usage

```ts
import MarkdownIt from "markdown-it";
import { inlineSvg } from "@mirrordown/mdit-inline-svg";

const md = MarkdownIt().use(inlineSvg, {
  optimize: true, // run each SVG through SVGO (default)
  deduplication: false // emit each occurrence inline rather than via <use>
});

md.render("![star](./icons/star.svg)");
```

### Options

| Option           | Default    | Description                                                  |
| ---------------- | ---------- | ------------------------------------------------------------ |
| `optimize`       | `true`     | Optimize SVGs with SVGO. Pass an SVGO `Config` to customize. |
| `deduplication`  | `false`    | Reuse repeated icons via `<symbol>`/`<use>`.                 |
| `maxImageSize`   | `3000`     | Skip inlining SVGs larger than this many bytes.              |
| `maxOccurrences` | `Infinity` | Maximum number of images to inline per render.               |
| `maxTotalSize`   | `10000`    | Maximum total inlined bytes per render.                      |

## Documentation

Full documentation, more examples, and configuration options: [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown) (dedicated docs site coming soon).

## License

MIT © [Drake Costa](https://saeris.gg)
