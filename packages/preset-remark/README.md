# @mirrordown/preset-remark

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified and markdown-it ecosystems.

The whole Mirrordown suite for remark and rehype in one call. Every feature is on by default and renders the same HTML as [`@mirrordown/preset-markdown-it`](https://github.com/mirrordown/mirrordown/tree/main/packages/preset-markdown-it) and [`@mirrordown/preset-satteri`](https://github.com/mirrordown/mirrordown/tree/main/packages/preset-satteri), apart from the differences listed in the notes below and in each plugin's guide. If you only want some features, install the individual `@mirrordown/remd-*` packages instead.

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
    // Astro highlights code before the plugins run; mermaid diagrams and file trees render instead.
    syntaxHighlight: { type: "shiki", excludeLangs: ["mermaid", "filetree"] },
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
  .use(rehypeStringify, { allowDangerousHtml: true });
```

### Styles

Import the stylesheets of every plugin that has one:

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

| Option              | Syntax                                      | Plugin                                |
| ------------------- | ------------------------------------------- | ------------------------------------- |
| `gfm`               | tables, `~~strike~~`, task lists            | `remark-gfm`                          |
| `abbr`              | `*[HTML]: HyperText…`                       | `@mirrordown/remd-abbr`               |
| `attrs`             | `{.class #id}`                              | `@mirrordown/remd-attrs`              |
| `autolinkHeadings`  | anchor links on headings                    | `@mirrordown/remd-autolink-headings`  |
| `caption`           | `~: caption` after a block                  | `@mirrordown/remd-caption`            |
| `copyCode`          | a copy button on code blocks                | `@mirrordown/remd-copy-code`          |
| `definitionList`    | `Term` / `: Definition`                     | `@mirrordown/remd-definition-list`    |
| `del`               | `--deleted--`                               | `@mirrordown/remd-del`                |
| `fileTree`          | ` ```filetree ` file trees                  | `@mirrordown/remd-file-tree`          |
| `githubAlerts`      | `> [!NOTE]`                                 | `@mirrordown/remd-github-alerts`      |
| `ins`               | `++inserted++`                              | `@mirrordown/remd-ins`                |
| `kbd`               | `[[Ctrl]]`                                  | `@mirrordown/remd-kbd`                |
| `lightbox`          | `!![alt](image.png)`                        | `@mirrordown/remd-lightbox`           |
| `mark`              | `==highlight==`                             | `@mirrordown/remd-mark`               |
| `mermaidPele`       | ` ```mermaid ` diagrams, rendered with Pele | `@mirrordown/remd-mermaid-pele`       |
| `prompt`            | ` ```prompt ` AI prompts                    | `@mirrordown/remd-prompt`             |
| `ruby`              | `{漢字\|かんじ}`                            | `@mirrordown/remd-ruby`               |
| `sectionize`        | headings wrapped in `<section>`             | `@mirrordown/remd-sectionize`         |
| `slug`              | heading ids                                 | `@mirrordown/remd-slug`               |
| `spoiler`           | `\|\|spoiler\|\|`                           | `@mirrordown/remd-spoiler`            |
| `squeezeParagraphs` | empty paragraphs removed                    | `@mirrordown/remd-squeeze-paragraphs` |
| `steps`             | `@1. Step`                                  | `@mirrordown/remd-steps`              |
| `sub`               | `~subscript~`                               | `@mirrordown/remd-sub`                |
| `sup`               | `^superscript^`                             | `@mirrordown/remd-sup`                |
| `tabs`              | `% Tab`                                     | `@mirrordown/remd-tabs`               |
| `tabIcons`          | icons on tab labels, `[!npm]`               | `@mirrordown/remd-tab-icons`          |
| `unwrapImages`      | images not wrapped in `<p>`                 | `@mirrordown/remd-unwrap-images`      |

## Notes

- **Diagrams are raw HTML.** `mermaidPele` replaces each diagram's code block with Pele's `<svg>` as a `raw` node, so it reaches the HTML exactly as Pele wrote it. Stringify with `allowDangerousHtml: true`, as above (Astro already does), or the diagrams come out as escaped text.
- **GFM is included.** The preset adds `remark-gfm` with single-tilde strikethrough off, so `~text~` is subscript and `~~text~~` is strikethrough. It returns `gfm: false` so a processor that adds its own GFM, like Astro's, doesn't add it again with single-tilde strikethrough on. Set `gfm: false` in the options to leave GFM out. Footnotes, task lists and bare-URL links are GFM's, and the markdown-it preset does not have them: a document that uses them renders differently there.
- **Smart punctuation stays off.** The preset returns `smartypants: false`: smart quotes and dashes would rewrite text that `del` and `attrs` read. To turn it on anyway, override it: `unified({ ...mirrordown(), smartypants: true })`.
- **`tabIcons` follows `tabs`.** With `tabs: { containerClass }` set, tab-icons looks for groups of that class, unless you give it a `containerClass` of its own.
- **`inline-svg` is not included.** It reads SVG files from disk and runs asynchronously; add [`@mirrordown/remd-inline-svg`](https://github.com/mirrordown/mirrordown/tree/main/packages/remd-inline-svg) to `rehypePlugins` yourself where that fits.
- **Raw HTML is the host's.** The preset passes only its handlers to remark-rehype. markdown-it escapes raw HTML unless it is created with `html: true`, remark-rehype drops it by default, and Sätteri keeps it, so a document that holds raw HTML renders differently across the presets until the hosts are set alike.
- **Astro highlights code first.** Leave `mermaid` and `filetree` out of highlighting, as above, so those fences reach the plugins. Shiki also rebuilds each code block without its fence's meta, which is where copy-code reads `nocopy` and prompt reads its services, `open` and title; the [copy-code](https://github.com/mirrordown/mirrordown/tree/main/packages/remd-copy-code) and [prompt](https://github.com/mirrordown/mirrordown/tree/main/packages/remd-prompt) READMEs show the transformer that keeps it.
- **Braces at the end of a block are attributes.** With `attrs` on, `{…}` at the end of a paragraph, heading or list item is read as attributes. Escape the opening brace (`{`) to keep one as text, or turn `attrs` off if your content ends blocks with literal braces.

## License

MIT © [Drake Costa](https://saeris.gg)
