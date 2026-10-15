# @mirrordown/preset-satteri

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified, markdown-it and Sätteri ecosystems.

The Mirrordown suite for [Sätteri](https://github.com/bruits/satteri) in one call. Every feature is on by default and renders the same HTML as [`@mirrordown/preset-remark`](https://github.com/mirrordown/mirrordown/tree/main/packages/preset-remark) and [`@mirrordown/preset-markdown-it`](https://github.com/mirrordown/mirrordown/tree/main/packages/preset-markdown-it). If you only want some features, install the individual `@mirrordown/sat-*` packages instead.

The Sätteri suite is still growing: this preset includes the features ported so far (below), and gains the rest as they land.

## Install

```sh
npm install @mirrordown/preset-satteri
```

## Usage

`mirrordown(options)` returns `{ features, mdastPlugins, hastPlugins }`.

### Standalone

```ts
import { markdownToHtml } from "satteri";
import { mirrordown } from "@mirrordown/preset-satteri";

const { html } = markdownToHtml(source, mirrordown());
```

### Astro

```ts
// astro.config.ts
import { defineConfig } from "astro/config";
import { satteri } from "@astrojs/markdown-satteri";
import { mirrordown } from "@mirrordown/preset-satteri";

export default defineConfig({
  markdown: {
    processor: satteri(mirrordown())
  }
});
```

Mirrordown's Sätteri plugins are factories (`(ctx) => plugin`), which Sätteri accepts and Astro passes through, but `@astrojs/markdown-satteri` currently types its plugin options as plain plugin definitions, so a type-checked config reports an error here even though it works.

### Styles

Import the stylesheets of every plugin that has one:

```ts
import "@mirrordown/preset-satteri/styles.css";
```

## Options

Every feature is on unless you set it to `false`. Features with options also take an options object, passed to their plugin:

```ts
mirrordown({
  githubAlerts: { icons: false },
  slug: { prefix: "user-content-" },
  features: { math: true }
});
```

| Option              | Syntax                                      | Provided by                          |
| ------------------- | ------------------------------------------- | ------------------------------------ |
| `gfm`               | tables, `~~strike~~`, task lists, autolinks | Sätteri's `gfm` feature              |
| `autolinkHeadings`  | anchor links on headings                    | `@mirrordown/sat-autolink-headings`  |
| `del`               | `--deleted--`                               | `@mirrordown/sat-del`                |
| `githubAlerts`      | `> [!NOTE]`                                 | `@mirrordown/sat-github-alerts`      |
| `ins`               | `++inserted++`                              | `@mirrordown/sat-ins`                |
| `kbd`               | `[[Ctrl]]`                                  | `@mirrordown/sat-kbd`                |
| `lightbox`          | `!![alt](image.png)`                        | `@mirrordown/sat-lightbox`           |
| `mark`              | `==highlight==`                             | `@mirrordown/sat-mark`               |
| `ruby`              | `{漢字\|かんじ}`                            | `@mirrordown/sat-ruby`               |
| `sectionize`        | headings wrapped in `<section>`             | `@mirrordown/sat-sectionize`         |
| `slug`              | heading ids                                 | `@mirrordown/sat-slug`               |
| `spoiler`           | `\|\|spoiler\|\|`                           | `@mirrordown/sat-spoiler`            |
| `squeezeParagraphs` | empty paragraphs removed                    | `@mirrordown/sat-squeeze-paragraphs` |
| `sub`               | `~subscript~`                               | Sätteri's `subscript` feature        |
| `sup`               | `^superscript^`                             | Sätteri's `superscript` feature      |
| `unwrapImages`      | images not wrapped in `<p>`                 | `@mirrordown/sat-unwrap-images`      |
| `features`          | any other Sätteri feature                   | merged over the preset's features    |

## Notes

- **Smart punctuation stays off.** The preset sets `smartPunctuation: false`, because hosts such as Astro turn it on by default and smart quotes and dashes rewrite text some plugins read. Pass `features: { smartPunctuation: true }` to turn it back on.
- **Synchronous.** The preset's plugins are all synchronous, and its types say so, so `markdownToHtml(source, mirrordown())` returns its result directly rather than a Promise.

## License

MIT © [Drake Costa](https://saeris.gg)
