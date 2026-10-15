# @mirrordown/sat-inline-svg

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified, markdown-it and Sätteri ecosystems.

A [Sätteri](https://github.com/bruits/satteri) plugin that inlines referenced SVG images directly into the rendered output.

## Overview

The `inline-svg` plugin replaces image references that point at `.svg` files with the SVG markup itself, so icons render as inline `<svg>` elements instead of `<img>` tags — stylable with CSS and free of an extra network request. SVGs are read from disk, optionally optimized with [SVGO](https://github.com/svg/svgo), and can be deduplicated when the same icon appears many times.

```markdown
![star](./icons/star.svg)
```

renders the contents of `star.svg` inline rather than `<img src="./icons/star.svg">`.

It is a hast plugin, and it reads files from disk, so it runs in Node, Deno and Bun but not in a browser. Image paths are resolved relative to the document, which Sätteri learns from the `fileURL` compile option; without one, images are left as they are.

## Install

```sh
npm install @mirrordown/sat-inline-svg
```

## Usage

### Standalone

```ts
import { pathToFileURL } from "node:url";
import { markdownToHtml } from "satteri";
import { satteriInlineSvg } from "@mirrordown/sat-inline-svg";

const { html } = markdownToHtml(source, {
  fileURL: pathToFileURL("docs/guide.md"),
  hastPlugins: [satteriInlineSvg({ optimize: true })]
});
```

### Astro

```ts
// astro.config.ts
import { defineConfig } from "astro/config";
import { satteri } from "@astrojs/markdown-satteri";
import { satteriInlineSvg } from "@mirrordown/sat-inline-svg";

export default defineConfig({
  markdown: {
    processor: satteri({ hastPlugins: [satteriInlineSvg()] })
  }
});
```

Astro passes each document's `fileURL`. Files are read synchronously and cached for as long as the plugin lives, so a build reads each SVG once.

### Output

The SVG file's markup is inserted verbatim as a `raw` node, with the image's alt text added as the `<svg>`'s `aria-label`. The output is byte-for-byte the same as [`@mirrordown/mdit-inline-svg`](https://www.npmjs.com/package/@mirrordown/mdit-inline-svg) and [`@mirrordown/remd-inline-svg`](https://www.npmjs.com/package/@mirrordown/remd-inline-svg), so the same document renders identically with any engine.

### Options

| Option            | Default    | Description                                                  |
| ----------------- | ---------- | ------------------------------------------------------------ |
| `optimize`        | `true`     | Optimize SVGs with SVGO. Pass an SVGO `Config` to customize. |
| `deduplication`   | `false`    | Reuse repeated icons via `<symbol>`/`<use>`.                 |
| `maxImageSize`    | `3000`     | Skip inlining SVGs larger than this many bytes.              |
| `maxOccurrences`  | `Infinity` | Maximum number of images to inline per render.               |
| `maxTotalSize`    | `10000`    | Maximum total inlined bytes per render.                      |
| `cacheEfficiency` | —          | Called with cache `{ hits, misses }` after a render reads.   |

## Documentation

Full documentation, more examples, and configuration options: [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown) (dedicated docs site coming soon).

## License

MIT © [Drake Costa](https://saeris.gg)
