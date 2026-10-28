# Mirrordown

A collection of [markdown-it](https://github.com/markdown-it/markdown-it) plugins, [remark](https://github.com/remarkjs/remark) plugins, [Sätteri](https://github.com/bruits/satteri) plugins, and VSCode Markdown Preview extensions that add extended syntax support for semantic HTML elements — each syntax implemented as a matched set so markdown-it, unified (remark) and Sätteri pipelines render identically.

---

## 📦 Packages

Each feature is implemented as a matched set: a markdown-it plugin, a remark/rehype plugin for unified pipelines, a Sätteri plugin (the Rust markdown processor behind Astro's `@astrojs/markdown-satteri`), and (usually) a VSCode extension for live preview support. The `mdit-*`, `remd-*` and `sat-*` plugins emit byte-identical HTML for the same input. Where Sätteri parses a syntax itself, the table names its built-in feature instead of a package.

### Presets

To use the whole suite, install one preset instead of each plugin: every feature on by default, any of them switched off with `false`.

| Ecosystem       | Package                                           | Usage                                                |
| --------------- | ------------------------------------------------- | ---------------------------------------------------- |
| markdown-it     | [preset-markdown-it](packages/preset-markdown-it) | `md.use(mirrordown)`                                 |
| remark / rehype | [preset-remark](packages/preset-remark)           | `unified(mirrordown())` (Astro), or unified          |
| Sätteri         | [preset-satteri](packages/preset-satteri)         | `satteri(mirrordown())` (Astro), or `markdownToHtml` |

### Inline elements

| Syntax            | HTML                                                                                  | markdown-it                           | remark                                | Sätteri                             | VSCode                                                          |
| ----------------- | ------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------- | ----------------------------------- | --------------------------------------------------------------- |
| `--delete--`      | [`<del>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/del)   | [mdit-del](packages/mdit-del)         | [remd-del](packages/remd-del)         | [sat-del](packages/sat-del)         | [markdown-del](extensions/markdown-del)                         |
| `++insert++`      | [`<ins>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/ins)   | [mdit-ins](packages/mdit-ins)         | [remd-ins](packages/remd-ins)         | [sat-ins](packages/sat-ins)         | [markdown-ins](extensions/markdown-ins)                         |
| `==mark==`        | [`<mark>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/mark) | [mdit-mark](packages/mdit-mark)       | [remd-mark](packages/remd-mark)       | [sat-mark](packages/sat-mark)       | [markdown-mark](extensions/markdown-mark)                       |
| `[[kbd]]`         | [`<kbd>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/kbd)   | [mdit-kbd](packages/mdit-kbd)         | [remd-kbd](packages/remd-kbd)         | [sat-kbd](packages/sat-kbd)         | [markdown-kbd](extensions/markdown-kbd)                         |
| `H~2~O`           | [`<sub>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/sub)   | [mdit-sub](packages/mdit-sub)         | [remd-sub](packages/remd-sub)         | built-in `subscript`                | [markdown-sub](extensions/markdown-sub)                         |
| `31^st^`          | [`<sup>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/sup)   | [mdit-sup](packages/mdit-sup)         | [remd-sup](packages/remd-sup)         | built-in `superscript`              | [markdown-sup](extensions/markdown-sup)                         |
| `*[term]: Title`  | [`<abbr>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/abbr) | [mdit-abbr](packages/mdit-abbr)       | [remd-abbr](packages/remd-abbr)       | [sat-abbr](packages/sat-abbr)       | [markdown-abbr](extensions/markdown-abbr)                       |
| `{本\|ほん}`      | [`<ruby>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/ruby) | [mdit-ruby](packages/mdit-ruby)       | [remd-ruby](packages/remd-ruby)       | [sat-ruby](packages/sat-ruby)       | [markdown-denden-furigana](extensions/markdown-denden-furigana) |
| `\|\|spoiler\|\|` | click-to-reveal (no JS)                                                               | [mdit-spoiler](packages/mdit-spoiler) | [remd-spoiler](packages/remd-spoiler) | [sat-spoiler](packages/sat-spoiler) | [markdown-spoiler](extensions/markdown-spoiler)                 |

### Block & structural

| Syntax                     | HTML                                                                                                       | markdown-it                                                 | remark                                                      | Sätteri                                                   | VSCode                                                                |
| -------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------- |
| `Term`<br>`: Definition`   | [`<dl>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dl)                          | [mdit-definition-list](packages/mdit-definition-list)       | [remd-definition-list](packages/remd-definition-list)       | built-in `definitionList`                                 | [markdown-definition-list](extensions/markdown-definition-list)       |
| `> [!NOTE]`                | Alert callout                                                                                              | [mdit-github-alerts](packages/mdit-github-alerts)           | [remd-github-alerts](packages/remd-github-alerts)           | [sat-github-alerts](packages/sat-github-alerts)           | [markdown-github-alerts](extensions/markdown-github-alerts)           |
| `@1. Step`                 | [`<ol>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/ol)                          | [mdit-steps](packages/mdit-steps)                           | [remd-steps](packages/remd-steps)                           | [sat-steps](packages/sat-steps)                           | [markdown-steps](extensions/markdown-steps)                           |
| `% Tab`                    | CSS-only tabs                                                                                              | [mdit-tabs](packages/mdit-tabs)                             | [remd-tabs](packages/remd-tabs)                             | [sat-tabs](packages/sat-tabs)                             | [markdown-tabs](extensions/markdown-tabs)                             |
| `## Heading` → wrap        | [`<section>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/section)                | [mdit-sectionize](packages/mdit-sectionize)                 | [remd-sectionize](packages/remd-sectionize)                 | [sat-sectionize](packages/sat-sectionize)                 | [markdown-sectionize](extensions/markdown-sectionize)                 |
| (empty `<p>`) → removed    | dropped empty paragraphs                                                                                   | [mdit-squeeze-paragraphs](packages/mdit-squeeze-paragraphs) | [remd-squeeze-paragraphs](packages/remd-squeeze-paragraphs) | [sat-squeeze-paragraphs](packages/sat-squeeze-paragraphs) | [markdown-squeeze-paragraphs](extensions/markdown-squeeze-paragraphs) |
| `~: caption` after a block | [`<figure>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/figure) + `<figcaption>` | [mdit-caption](packages/mdit-caption)                       | [remd-caption](packages/remd-caption)                       | [sat-caption](packages/sat-caption)                       | [markdown-caption](extensions/markdown-caption)                       |

### Attributes

| Syntax         | HTML               | markdown-it                       | remark                            | Sätteri               | VSCode                                      |
| -------------- | ------------------ | --------------------------------- | --------------------------------- | --------------------- | ------------------------------------------- |
| `{.class #id}` | Element attributes | [mdit-attrs](packages/mdit-attrs) | [remd-attrs](packages/remd-attrs) | built-in `attributes` | [markdown-attrs](extensions/markdown-attrs) |

### Images

| Syntax             | HTML                                                                                      | markdown-it                                       | remark                                            | Sätteri                                         | VSCode                                                      |
| ------------------ | ----------------------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------- |
| `![](…img.svg)`    | inlined `<svg>`                                                                           | [mdit-inline-svg](packages/mdit-inline-svg)       | [remd-inline-svg](packages/remd-inline-svg)       | [sat-inline-svg](packages/sat-inline-svg)       | [markdown-inline-svg](extensions/markdown-inline-svg)       |
| `!![](…img)`       | [`<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog) | [mdit-lightbox](packages/mdit-lightbox)           | [remd-lightbox](packages/remd-lightbox)           | [sat-lightbox](packages/sat-lightbox)           | [markdown-lightbox](extensions/markdown-lightbox)           |
| standalone `![]()` | unwrapped `<img>`                                                                         | [mdit-unwrap-images](packages/mdit-unwrap-images) | [remd-unwrap-images](packages/remd-unwrap-images) | [sat-unwrap-images](packages/sat-unwrap-images) | [markdown-unwrap-images](extensions/markdown-unwrap-images) |

### Diagrams

| Syntax         | HTML                   | markdown-it                                     | remark                                          | Sätteri                                       | VSCode                                                    |
| -------------- | ---------------------- | ----------------------------------------------- | ----------------------------------------------- | --------------------------------------------- | --------------------------------------------------------- |
| ` ```mermaid ` | inline `<svg>` (no JS) | [mdit-mermaid-pele](packages/mdit-mermaid-pele) | [remd-mermaid-pele](packages/remd-mermaid-pele) | [sat-mermaid-pele](packages/sat-mermaid-pele) | [markdown-mermaid-pele](extensions/markdown-mermaid-pele) |

### Headings

| Syntax              | HTML                                                                            | markdown-it                                               | remark                                                    | Sätteri                                                 | VSCode                                                              |
| ------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------- |
| `## Heading` → id   | heading `id` slug                                                               | [mdit-slug](packages/mdit-slug)                           | [remd-slug](packages/remd-slug)                           | [sat-slug](packages/sat-slug)                           | —                                                                   |
| `## Heading` → link | [`<a>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a) | [mdit-autolink-headings](packages/mdit-autolink-headings) | [remd-autolink-headings](packages/remd-autolink-headings) | [sat-autolink-headings](packages/sat-autolink-headings) | [markdown-autolink-headings](extensions/markdown-autolink-headings) |

> All VSCode extensions are also bundled together in the [Markdown Preview Extended Syntax](extensions/markdown-preview-extended-syntax) pack. Heading slugs are provided in the preview by the Heading Anchors extension (and by VSCode's own built-in heading ids), so `slug` has no standalone extension.

---

## 🔧 Local Development

This project uses [Vite+](https://vite.plus) (`vp`), a unified toolchain that wraps Vite, Vitest, Oxlint, Oxfmt, and more under a single CLI. Install it globally before getting started. Vite+ will automatically use the preferred package manager for this project (Yarn).

**Install dependencies:**

```sh
vp install
```

**Run all checks (format, lint, type-check):**

```sh
vp run --filter "./packages/**" build
vp check
```

The type check reads each workspace package's built types, so build first (after a fresh checkout, or when you change a package another one imports). An unbuilt package doesn't fail the check; its types quietly become `any`.

**Run tests:**

```sh
vp test
```

**Build all packages:**

```sh
vp run -r build
```

---

## 📣 Acknowledgements

The plugins in this collection are forked and modernized from the following upstream projects:

- [markdown-it-ins](https://github.com/markdown-it/markdown-it-ins) — original `<ins>` plugin for markdown-it
- [markdown-it-mark](https://github.com/markdown-it/markdown-it-mark) — original `<mark>` plugin for markdown-it
- [markdown-it-abbr](https://github.com/markdown-it/markdown-it-abbr) — original `<abbr>` plugin for markdown-it
- [@mdit/plugin-del](https://github.com/mdit-plugins/mdit-plugins) — `<del>` plugin for markdown-it
- [@mdit/plugin-kbd](https://github.com/mdit-plugins/mdit-plugins) — `<kbd>` plugin for markdown-it
- [@mdit/plugin-sub](https://github.com/mdit-plugins/mdit-plugins) — `<sub>` plugin for markdown-it
- [@mdit/plugin-sup](https://github.com/mdit-plugins/mdit-plugins) — `<sup>` plugin for markdown-it
- [markdown-it-ruby](https://github.com/lostandfound/markdown-it-ruby) — `<ruby>` plugin for markdown-it
- [remark-ins](https://github.com/ipikuka/remark-ins) — `<ins>` plugin for remark
- [remark-mark](https://github.com/ipikuka/remark-mark) — `<mark>` plugin for remark
- [remark-supersub](https://github.com/domdomegg/remark-supersub) — `<sup>`/`<sub>` plugins for remark
- [remd-ruby](https://github.com/lostandfound/remd-ruby) — `<ruby>` plugin for remark
- [rehype-slug](https://github.com/rehypejs/rehype-slug) — heading `id` slugs for rehype
- [rehype-autolink-headings](https://github.com/rehypejs/rehype-autolink-headings) — heading anchor links for rehype
- [remark-sectionize](https://github.com/jake-low/remark-sectionize) — `<section>` heading wrappers for remark
- [remark-squeeze-paragraphs](https://github.com/remarkjs/remark-squeeze-paragraphs) — empty-paragraph removal for remark
- [rehype-mermaid](https://github.com/remcohaszing/rehype-mermaid) — the API and test cases `mermaid-pele` follows; [Pele](https://pele.run) renders the diagrams

---

## 🥂 License

Released under the [MIT license](./LICENSE.md) © [Drake Costa](https://saeris.gg).
