# @mirrordown/preset-remark

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified and markdown-it ecosystems.

The whole Mirrordown suite for remark and rehype in one call. Every feature is on by default and renders the same HTML as [`@mirrordown/preset-markdown-it`](https://github.com/mirrordown/mirrordown/tree/main/packages/preset-markdown-it). If you only want some features, install the individual `@mirrordown/remd-*` packages instead.

## Install

```sh
npm install @mirrordown/preset-remark
```

## Usage

`mirrordown(options)` returns `{ remarkPlugins, rehypePlugins, remarkRehype, gfm, smartypants }`.

### Astro

The result is the shape Astro's `unified()` processor takes:

```ts
// astro.config.ts
import { defineConfig } from "astro/config";
import { unified } from "@astrojs/markdown-remark";
import { mirrordown } from "@mirrordown/preset-remark";

export default defineConfig({
  markdown: {
    processor: unified(mirrordown())
  }
});
```

### Unified

```ts
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { mirrordown } from "@mirrordown/preset-remark";

const {
  remarkPlugins,
  rehypePlugins,
  remarkRehype: remarkRehypeOptions
} = mirrordown();

const processor = unified()
  .use(remarkParse)
  .use(remarkPlugins)
  .use(remarkRehype, remarkRehypeOptions)
  .use(rehypePlugins)
  .use(rehypeStringify);
```

### Styles

Tabs, steps, alerts, spoilers, the lightbox and heading anchors ship stylesheets. Import them all at once:

```ts
import "@mirrordown/preset-remark/styles.css";
```

## Options

Every feature is on unless you set it to `false`. Features with options also take an options object, passed to their plugin:

```ts
mirrordown({
  lightbox: false,
  githubAlerts: { icons: false },
  slug: { prefix: "user-content-" }
});
```

| Option              | Syntax                           | Plugin                                |
| ------------------- | -------------------------------- | ------------------------------------- |
| `gfm`               | tables, `~~strike~~`, task lists | `remark-gfm`                          |
| `abbr`              | `*[HTML]: HyperText…`            | `@mirrordown/remd-abbr`               |
| `attrs`             | `{.class #id}`                   | `@mirrordown/remd-attrs`              |
| `autolinkHeadings`  | anchor links on headings         | `@mirrordown/remd-autolink-headings`  |
| `definitionList`    | `Term` / `: Definition`          | `@mirrordown/remd-definition-list`    |
| `del`               | `--deleted--`                    | `@mirrordown/remd-del`                |
| `githubAlerts`      | `> [!NOTE]`                      | `@mirrordown/remd-github-alerts`      |
| `ins`               | `++inserted++`                   | `@mirrordown/remd-ins`                |
| `kbd`               | `[[Ctrl]]`                       | `@mirrordown/remd-kbd`                |
| `lightbox`          | `!![alt](image.png)`             | `@mirrordown/remd-lightbox`           |
| `mark`              | `==highlight==`                  | `@mirrordown/remd-mark`               |
| `ruby`              | `{漢字\|かんじ}`                 | `@mirrordown/remd-ruby`               |
| `sectionize`        | headings wrapped in `<section>`  | `@mirrordown/remd-sectionize`         |
| `slug`              | heading ids                      | `@mirrordown/remd-slug`               |
| `spoiler`           | `\|\|spoiler\|\|`                | `@mirrordown/remd-spoiler`            |
| `squeezeParagraphs` | empty paragraphs removed         | `@mirrordown/remd-squeeze-paragraphs` |
| `steps`             | `@1. Step`                       | `@mirrordown/remd-steps`              |
| `sub`               | `~subscript~`                    | `@mirrordown/remd-sub`                |
| `sup`               | `^superscript^`                  | `@mirrordown/remd-sup`                |
| `tabs`              | `% Tab`                          | `@mirrordown/remd-tabs`               |
| `unwrapImages`      | images not wrapped in `<p>`      | `@mirrordown/remd-unwrap-images`      |

## Notes

- **GFM is included.** The preset adds `remark-gfm` with single-tilde strikethrough off, so `~text~` is subscript and `~~text~~` is strikethrough. It returns `gfm: false` so a processor that adds its own GFM, like Astro's, doesn't add it again with single-tilde strikethrough on. Set `gfm: false` in the options to leave GFM out.
- **Smart punctuation stays off.** The preset returns `smartypants: false`: smart quotes and dashes would rewrite text that `del` and `attrs` read. To turn it on anyway, override it: `unified({ ...mirrordown(), smartypants: true })`.
- **`inline-svg` is not included.** It reads SVG files from disk and runs asynchronously; add [`@mirrordown/remd-inline-svg`](https://github.com/mirrordown/mirrordown/tree/main/packages/remd-inline-svg) to `rehypePlugins` yourself where that fits.
- **Braces at the end of a block are attributes.** With `attrs` on, `{…}` at the end of a paragraph, heading or list item is always read as attributes, even escaped; turn `attrs` off if your content ends blocks with literal braces.

## License

MIT © [Drake Costa](https://saeris.gg)
