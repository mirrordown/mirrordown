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
import { pathToFileURL } from "node:url";
import MarkdownIt from "markdown-it";
import { inlineSvg } from "@mirrordown/mdit-inline-svg";

const md = MarkdownIt().use(inlineSvg, {
  optimize: true, // run each SVG through SVGO (default)
  deduplication: false // emit each occurrence inline rather than via <use>
});

md.render("![star](./icons/star.svg)", {
  currentDocument: pathToFileURL("docs/guide.md")
});
```

Image paths are resolved relative to the document, which the plugin learns from `env.currentDocument`, a `file:` URL (as a `URL` or a string). Without one, images are left as they are.

### Options

| Option            | Default    | Description                                                  |
| ----------------- | ---------- | ------------------------------------------------------------ |
| `optimize`        | `true`     | Optimize SVGs with SVGO. Pass an SVGO `Config` to customize. |
| `deduplication`   | `false`    | Reuse repeated icons via `<symbol>`/`<use>`.                 |
| `maxImageSize`    | `3000`     | Skip an SVG larger than this many characters.                |
| `maxOccurrences`  | `Infinity` | Skip an SVG referenced more than this many times.            |
| `maxTotalSize`    | `10000`    | Skip an SVG whose occurrences total more characters.         |
| `cacheEfficiency` | —          | Called with cache `{ hits, misses }` after a render reads.   |

With `deduplication`, a sprite's id is a hash of the SVG's path relative to the document, so it is unique per document, not per page: two documents rendered into one page that reuse an SVG at the same relative path write the same id.

## Security

The markdown and the SVG files it references are treated as trusted input. An image path may name any `.svg` file the build can read (`../` is followed), and an inlined SVG becomes part of the page, where its scripts, event handlers and external references are live, which they are not behind an `<img>`. SVGO's default preset does not remove them, and with `optimize: false` the file is inserted as it is. Do not use this plugin on markdown or SVG files you do not control.

## Documentation

Full documentation, more examples, and configuration options: [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown) (dedicated docs site coming soon).

## License

MIT © [Drake Costa](https://saeris.gg)
