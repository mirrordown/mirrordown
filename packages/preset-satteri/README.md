# @mirrordown/preset-satteri

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified, markdown-it and Sätteri ecosystems.

The Mirrordown suite for [Sätteri](https://github.com/bruits/satteri) in one call. Every feature is on by default and renders the same HTML as [`@mirrordown/preset-remark`](https://github.com/mirrordown/mirrordown/tree/main/packages/preset-remark) and [`@mirrordown/preset-markdown-it`](https://github.com/mirrordown/mirrordown/tree/main/packages/preset-markdown-it), apart from the differences listed in the notes below and in each plugin's guide. If you only want some features, install the individual `@mirrordown/sat-*` packages instead.

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
    // Astro highlights code before the plugins run; mermaid diagrams and file trees render instead.
    syntaxHighlight: { type: "shiki", excludeLangs: ["mermaid", "filetree"] },
    processor: satteri(mirrordown())
  }
});
```

Mirrordown's Sätteri plugins are factories (`(ctx) => plugin`). `@astrojs/markdown-satteri` 0.4 and later accept them in a type-checked config; older versions typed the plugin options as plain plugin definitions and reported an error, though the config worked.

### Styles

Import the stylesheets of every plugin that has one:

```ts
import "@mirrordown/preset-satteri/styles.css";
```

## Options

Every feature is on unless you set it to `false`. Features with options also take an options object, passed to their plugin; `attrs` and `definitionList` are Sätteri's own features and take only `true` or `false`:

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
| `abbr`              | `*[HTML]: HyperText…`                       | `@mirrordown/sat-abbr`               |
| `attrs`             | `{.class #id}`                              | Sätteri's `attributes` feature       |
| `autolinkHeadings`  | anchor links on headings                    | `@mirrordown/sat-autolink-headings`  |
| `caption`           | `~: caption` after a block                  | `@mirrordown/sat-caption`            |
| `copyCode`          | a copy button on code blocks                | `@mirrordown/sat-copy-code`          |
| `definitionList`    | `Term` / `: Definition`                     | Sätteri's `definitionList` feature   |
| `del`               | `--deleted--`                               | `@mirrordown/sat-del`                |
| `fileTree`          | ` ```filetree ` file trees                  | `@mirrordown/sat-file-tree`          |
| `githubAlerts`      | `> [!NOTE]`                                 | `@mirrordown/sat-github-alerts`      |
| `ins`               | `++inserted++`                              | `@mirrordown/sat-ins`                |
| `kbd`               | `[[Ctrl]]`                                  | `@mirrordown/sat-kbd`                |
| `lightbox`          | `!![alt](image.png)`                        | `@mirrordown/sat-lightbox`           |
| `mark`              | `==highlight==`                             | `@mirrordown/sat-mark`               |
| `mermaidPele`       | ` ```mermaid ` diagrams, rendered with Pele | `@mirrordown/sat-mermaid-pele`       |
| `prompt`            | ` ```prompt ` AI prompts                    | `@mirrordown/sat-prompt`             |
| `ruby`              | `{漢字\|かんじ}`                            | `@mirrordown/sat-ruby`               |
| `sectionize`        | headings wrapped in `<section>`             | `@mirrordown/sat-sectionize`         |
| `slug`              | heading ids                                 | `@mirrordown/sat-slug`               |
| `spoiler`           | `\|\|spoiler\|\|`                           | `@mirrordown/sat-spoiler`            |
| `squeezeParagraphs` | empty paragraphs removed                    | `@mirrordown/sat-squeeze-paragraphs` |
| `steps`             | `@1. Step`                                  | `@mirrordown/sat-steps`              |
| `sub`               | `~subscript~`                               | Sätteri's `subscript` feature        |
| `sup`               | `^superscript^`                             | Sätteri's `superscript` feature      |
| `tabs`              | `% Tab`                                     | `@mirrordown/sat-tabs`               |
| `tabIcons`          | icons on tab labels, `[!npm]`               | `@mirrordown/sat-tab-icons`          |
| `unwrapImages`      | images not wrapped in `<p>`                 | `@mirrordown/sat-unwrap-images`      |
| `features`          | any other Sätteri feature                   | merged over the preset's features    |

## Notes

- **Smart punctuation stays off.** The preset sets `smartPunctuation: false`, because hosts such as Astro turn it on by default and smart quotes and dashes rewrite text some plugins read. Pass `features: { smartPunctuation: true }` to turn it back on.
- **GFM is Sätteri's.** Footnotes, task lists and bare-URL links come with the `gfm` feature, and the markdown-it preset does not have them: a document that uses them renders differently there.
- **Raw HTML is the host's.** The preset leaves Sätteri's handling of it as it is. markdown-it escapes raw HTML unless it is created with `html: true`, remark-rehype drops it by default, and Sätteri keeps it, so a document that holds raw HTML renders differently across the presets until the hosts are set alike.
- **Astro highlights code first.** Leave `mermaid` and `filetree` out of highlighting, as above, so those fences reach the plugins. Shiki also rebuilds each code block without its fence's meta, which is where copy-code reads `nocopy` and prompt reads its services, `open` and title; the [copy-code](https://github.com/mirrordown/mirrordown/tree/main/packages/sat-copy-code) and [prompt](https://github.com/mirrordown/mirrordown/tree/main/packages/sat-prompt) READMEs show the transformer that keeps it.
- **Synchronous.** The preset's plugins are all synchronous, and its types say so, so `markdownToHtml(source, mirrordown())` returns its result directly rather than a Promise.
- **`tabIcons` follows `tabs`.** With `tabs: { containerClass }` set, tab-icons looks for groups of that class, unless you give it a `containerClass` of its own.
- **`inline-svg` is not included.** It reads SVG files from disk; add [`@mirrordown/sat-inline-svg`](https://github.com/mirrordown/mirrordown/tree/main/packages/sat-inline-svg) to `hastPlugins` yourself where that fits.

## License

MIT © [Drake Costa](https://saeris.gg)
