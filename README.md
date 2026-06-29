# Mirrordown

A collection of [markdown-it](https://github.com/markdown-it/markdown-it) plugins, [remark](https://github.com/remarkjs/remark) plugins, and VSCode Markdown Preview extensions that add extended syntax support for semantic HTML elements — each syntax implemented as a matched set so server-side (markdown-it) and unified (remark) pipelines render identically.

---

## 📦 Packages

Each syntax feature is implemented as a matched set: a markdown-it plugin for server-side rendering pipelines, a remark plugin for unified/rehype pipelines, and a VSCode extension for live preview support.

| Syntax            | HTML                                                                                      | markdown-it                                 | remark                                      | VSCode                                                          |
| ----------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------- |
| `--delete--`      | [`<del>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/del)       | [mdit-del](packages/mdit-del)               | [remd-del](packages/remd-del)               | [markdown-del](extensions/markdown-del)                         |
| `++insert++`      | [`<ins>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/ins)       | [mdit-ins](packages/mdit-ins)               | [remd-ins](packages/remd-ins)               | [markdown-ins](extensions/markdown-ins)                         |
| `==mark==`        | [`<mark>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/mark)     | [mdit-mark](packages/mdit-mark)             | [remd-mark](packages/remd-mark)             | [markdown-mark](extensions/markdown-mark)                       |
| `[[kbd]]`         | [`<kbd>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/kbd)       | [mdit-kbd](packages/mdit-kbd)               | [remd-kbd](packages/remd-kbd)               | [markdown-kbd](extensions/markdown-kbd)                         |
| `H~2~O`           | [`<sub>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/sub)       | [mdit-sub](packages/mdit-sub)               | [remd-sub](packages/remd-sub)               | [markdown-sub](extensions/markdown-sub)                         |
| `31^st^`          | [`<sup>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/sup)       | [mdit-sup](packages/mdit-sup)               | [remd-sup](packages/remd-sup)               | [markdown-sup](extensions/markdown-sup)                         |
| `*[term]: Title`  | [`<abbr>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/abbr)     | [mdit-abbr](packages/mdit-abbr)             | [remd-abbr](packages/remd-abbr)             | [markdown-abbr](extensions/markdown-abbr)                       |
| `{本\|ほん}`      | [`<ruby>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/ruby)     | [mdit-ruby](packages/mdit-ruby)             | [remd-ruby](packages/remd-ruby)             | [markdown-denden-furigana](extensions/markdown-denden-furigana) |
| `![](...img.svg)` | n/a                                                                                       | [mdit-inline-svg](packages/mdit-inline-svg) | [remd-inline-svg](packages/remd-inline-svg) | [markdown-inline-svg](extensions/markdown-inline-svg)           |
| `!![](...img)`    | [`<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog) | [mdit-lightbox](packages/mdit-lightbox)     | [remd-lightbox](packages/remd-lightbox)     | [markdown-lightbox](extensions/markdown-lightbox)               |

---

## 🔧 Local Development

This project uses [Vite+](https://vite.plus) (`vp`), a unified toolchain that wraps Vite, Vitest, Oxlint, Oxfmt, and more under a single CLI. Install it globally before getting started. Vite+ will automatically use the preferred package manager for this project (Yarn).

**Install dependencies:**

```sh
vp install
```

**Run all checks (format, lint, type-check):**

```sh
vp check
```

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

---

## 🥂 License

Released under the [MIT license](./LICENSE.md) © [Drake Costa](https://saeris.gg).
