# @mirrordown/preset-markdown-it

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified and markdown-it ecosystems.

The whole Mirrordown suite for markdown-it as one plugin. Every feature is on by default and renders the same HTML as [`@mirrordown/preset-remark`](https://github.com/mirrordown/mirrordown/tree/main/packages/preset-remark). If you only want some features, install the individual `@mirrordown/mdit-*` packages instead.

## Install

```sh
npm install @mirrordown/preset-markdown-it
```

## Usage

### Standalone

```ts
import MarkdownIt from "markdown-it";
import { mirrordown } from "@mirrordown/preset-markdown-it";

const md = new MarkdownIt().use(mirrordown);
```

### VitePress

```ts
// .vitepress/config.ts
import { defineConfig } from "vitepress";
import { mirrordown } from "@mirrordown/preset-markdown-it";

export default defineConfig({
  markdown: {
    config: (md) => md.use(mirrordown)
  }
});
```

### Styles

Tabs, steps, alerts, spoilers, the lightbox, heading anchors, captions and diagrams ship stylesheets. Import them all at once:

```ts
import "@mirrordown/preset-markdown-it/styles";
```

## Options

Every feature is on unless you set it to `false`. Features with options also take an options object, passed to their plugin:

```ts
md.use(mirrordown, {
  lightbox: false,
  githubAlerts: { icons: false },
  slug: { prefix: "user-content-" }
});
```

| Option              | Syntax                                      | Plugin                                |
| ------------------- | ------------------------------------------- | ------------------------------------- |
| `abbr`              | `*[HTML]: HyperText…`                       | `@mirrordown/mdit-abbr`               |
| `attrs`             | `{.class #id}`                              | `@mirrordown/mdit-attrs`              |
| `autolinkHeadings`  | anchor links on headings                    | `@mirrordown/mdit-autolink-headings`  |
| `caption`           | `~: caption` after a block                  | `@mirrordown/mdit-caption`            |
| `copyCode`          | a copy button on code blocks                | `@mirrordown/mdit-copy-code`          |
| `definitionList`    | `Term` / `: Definition`                     | `@mirrordown/mdit-definition-list`    |
| `del`               | `--deleted--`                               | `@mirrordown/mdit-del`                |
| `fileTree`          | ` ```filetree ` file trees                  | `@mirrordown/mdit-file-tree`          |
| `githubAlerts`      | `> [!NOTE]`                                 | `@mirrordown/mdit-github-alerts`      |
| `ins`               | `++inserted++`                              | `@mirrordown/mdit-ins`                |
| `kbd`               | `[[Ctrl]]`                                  | `@mirrordown/mdit-kbd`                |
| `lightbox`          | `!![alt](image.png)`                        | `@mirrordown/mdit-lightbox`           |
| `mark`              | `==highlight==`                             | `@mirrordown/mdit-mark`               |
| `mermaidPele`       | ` ```mermaid ` diagrams, rendered with Pele | `@mirrordown/mdit-mermaid-pele`       |
| `prompt`            | ` ```prompt ` AI prompts                    | `@mirrordown/mdit-prompt`             |
| `ruby`              | `{漢字\|かんじ}`                            | `@mirrordown/mdit-ruby`               |
| `sectionize`        | headings wrapped in `<section>`             | `@mirrordown/mdit-sectionize`         |
| `slug`              | heading ids                                 | `@mirrordown/mdit-slug`               |
| `spoiler`           | `\|\|spoiler\|\|`                           | `@mirrordown/mdit-spoiler`            |
| `squeezeParagraphs` | empty paragraphs removed                    | `@mirrordown/mdit-squeeze-paragraphs` |
| `steps`             | `@1. Step`                                  | `@mirrordown/mdit-steps`              |
| `sub`               | `~subscript~`                               | `@mirrordown/mdit-sub`                |
| `sup`               | `^superscript^`                             | `@mirrordown/mdit-sup`                |
| `tabs`              | `% Tab`                                     | `@mirrordown/mdit-tabs`               |
| `tabIcons`          | icons on tab labels, `[!npm]`               | `@mirrordown/mdit-tab-icons`          |
| `unwrapImages`      | images not wrapped in `<p>`                 | `@mirrordown/mdit-unwrap-images`      |

## Notes

- **GFM is markdown-it's own.** markdown-it reads tables and `~~strikethrough~~` out of the box; `~text~` is subscript either way. The preset leaves markdown-it's configuration alone, with one exception: strikethrough renders as `<del>`, as remark-gfm and Sätteri render it, where markdown-it alone renders `<s>`.
- **The rest of GFM is not included.** markdown-it has no footnotes, task lists or bare-URL links of its own, and the preset adds no dependency for them, so a document that uses them renders differently here than with the remark and Sätteri presets: `[^1]: Note.` is read as a link reference definition, `- [ ] task` keeps its brackets and `www.example.com` stays text. Add a markdown-it plugin for each you need (and `linkify: true` for URLs). Aligned table columns are written as `style="text-align:left"`, where remark writes `align="left"`.
- **`tabIcons` follows `tabs`.** With `tabs: { containerClass }` set, tab-icons looks for groups of that class, unless you give it a `containerClass` of its own.
- **`inline-svg` is not included.** It reads SVG files from disk; add [`@mirrordown/mdit-inline-svg`](https://github.com/mirrordown/mirrordown/tree/main/packages/mdit-inline-svg) yourself where that fits.
- **Braces at the end of a block are attributes.** With `attrs` on, `{…}` at the end of a paragraph, heading or list item is always read as attributes, even escaped; turn `attrs` off if your content ends blocks with literal braces.

## License

MIT © [Drake Costa](https://saeris.gg)
