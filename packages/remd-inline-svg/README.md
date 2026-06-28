# @mirrordown/remd-inline-svg

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified and markdown-it ecosystems.

A rehype (unified) plugin that inlines referenced SVG images directly into the rendered output.

## Overview

The `inline-svg` plugin replaces image references that point at `.svg` files with the SVG markup itself, so icons render as inline `<svg>` elements instead of `<img>` tags — stylable with CSS and free of an extra network request. SVGs are read from disk, optionally optimized with [SVGO](https://github.com/svg/svgo), and can be deduplicated when the same icon appears many times.

```markdown
![star](./icons/star.svg)
```

renders the contents of `star.svg` inline rather than `<img src="./icons/star.svg">`.

It operates on the hast tree, so it runs after `remark-rehype`.

## Install

```sh
npm install @mirrordown/remd-inline-svg
```

## Usage

```ts
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { rehypeInlineSvg } from "@mirrordown/remd-inline-svg";

const processor = unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(rehypeInlineSvg, { optimize: true })
  .use(rehypeStringify);
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
