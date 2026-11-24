# Changelog




## 0.2.0
<sub>2026-11-24</sub>

- *(minor)*
  Highlight variants: a highlight that starts with a marker emoji is a coloured pill, for Obsidian's highlight colours and for label-style badges. A highlight that starts with one of the default markers renders differently than before.

  - **A colour emoji straight after the opening `==` colours the highlight** (all engines), as in Obsidian. The emoji is removed and the colour is named on the `<mark>`.

    ```markdown
    ==🔴Important== and ==🟢 done==
    ```

    Was `<mark>🔴Important</mark>` and `<mark>🟢 done</mark>`. Now `<mark data-highlight="red">Important</mark>` and `<mark data-highlight="green"> done</mark>`. Six colours, each with a circle and a square: 🔴🟥 red, 🟠🟧 orange, 🟡🟨 yellow, 🟢🟩 green, 🔵🟦 blue, 🟣🟪 purple.

  - **Ten label markers name a variant and keep their emoji** (all engines): GitHub's default issue labels and a warning.

    ```markdown
    ==🐛 Bug== ==⚠️ Deprecated==
    ```

    Was plain highlights. Now `<mark data-highlight="bug">🐛 Bug</mark>` and `<mark data-highlight="warning">⚠️ Deprecated</mark>`. The markers are 🐛 `bug`, 📖 `documentation`, ✨ `enhancement`, ❓ `question`, 🙋 `help-wanted`, 🌱 `good-first-issue`, 👯 `duplicate`, 🚫 `invalid`, ⛔ `wontfix` and ⚠️ `warning`. The emoji stays, so a label can be told apart without its colour.

  - **A marker counts only as the highlight's very first character.** `==te🔴xt==` and `==**🔴bold**==` are plain highlights, and a marker written as a character reference is text. `⚠` and `⚠️` are the same marker.

  - **The `markers` option** (all engines) adds a marker, renames one, hides or shows its emoji, or turns a default off.

    ```ts
    remarkMark({
      markers: {
        "🚀": "release", // ==🚀 v2== is <mark data-highlight="release">🚀 v2</mark>
        "✅": { name: "done", keep: false }, // the emoji is removed
        "🟡": false // 🟡 is text again
      }
    })
    ```

  - **A stylesheet draws every variant as a pill** (all engines), in the style of Vocs' badges: a tinted background, text in a stronger shade of the same colour, in a light and a dark scheme. The set shipped no stylesheet before. Import `@mirrordown/mdit-mark/styles`, `@mirrordown/remd-mark/mark.css` or `@mirrordown/sat-mark/mark.css`; without it a variant looks like a plain highlight. A plain `<mark>` keeps the browser's own style. Each default's colour can be set through a custom property, and a variant of your own takes one declaration:

    ```css
    :root { --markdown-mark-bug: oklch(0.6 0.2 5); }
    mark[data-highlight="release"] { --markdown-mark-color: oklch(0.6 0.15 300); }
    ```

  - **A `data-highlight` written in an attribute block wins** (all engines), with the attrs plugin or Sätteri's `attributes` feature.

  The VS Code extension shows the pills in the preview, in light and dark themes.

  `@mirrordown/core` gains `createHighlightMarkers`, `HIGHLIGHT_MARKERS` and the `MarkOptions` type.

## 0.1.2
<sub>2026-06-27</sub>

- *(patch)*
  Fix broken syntax rendering: the published 0.1.1 vsix files externalized the
  bundled markdown-it plugin (a bare `require("@mirrordown/mdit-*")` that isn't in
  the vsix), so no extension actually loaded its plugin. Force-bundle the plugin
  via `pack.deps.alwaysBundle`, and build the plugin packages before the
  extensions in CI so there is a dist to bundle.

## 0.1.1
<sub>2026-06-27</sub>

- *(patch)*
  Initial VSCode Marketplace release (pilot). Validates the `vsce` publish
  pipeline before enabling the remaining extensions.

## 0.1.0

<sub>2026-06-23</sub>

- _(minor)_

  # Initial release

  First public release of the `@mirrordown/markdown` suite — a collection of markdown syntax extensions for the [unified](https://unifiedjs.com/) (remark/rehype) and [markdown-it](https://github.com/markdown-it/markdown-it) ecosystems.

  ## Packages

  **Remark/rehype plugins** (`@mirrordown/remd-*`):
  - `abbr` — abbreviation definitions that auto-expand matching text with `<abbr>` tooltips
  - `attrs` — `{attrs}` syntax for adding HTML attributes to markdown elements
  - `definition-list` — `<dl>`/`<dt>`/`<dd>` syntax from PHP Markdown Extra
  - `del` — `~~strikethrough~~` rendered as `<del>` instead of `<s>`
  - `github-alerts` — `> [!NOTE]` callout boxes matching GitHub's alert syntax
  - `inline-svg` — inlines local `.svg` images into the HTML output with size/occurrence/sprite controls
  - `ins` — `++inserted text++` rendered as `<ins>`
  - `kbd` — `[[Ctrl]]+[[C]]` syntax for `<kbd>` keyboard input elements
  - `mark` — `==highlighted text==` rendered as `<mark>`
  - `ruby` — DenDen-ruby syntax (`{base|reading}`) for `<ruby>`/`<rt>`/`<rp>` annotations
  - `steps` — numbered `@N. step` syntax for procedural guides
  - `sub` — `~subscript~` rendered as `<sub>`
  - `sup` — `^superscript^` rendered as `<sup>`
  - `tabs` — `% Tab` syntax for tabbed content panels
  - `unwrap-images` — lifts block-only images out of wrapping `<p>` tags

  **Markdown-it plugins** (`@mirrordown/mdit-*`): same plugin set, ported for the markdown-it pipeline.

  **VSCode extensions** (`markdown-*`): each plugin wrapped as a VSCode extension that contributes its syntax to the built-in markdown preview. (Publishing to the VSCode Marketplace is wired separately and is not part of this npm release.)

  ## Highlights
  - Designed to work together — `attrs` understands custom container nodes from `tabs`/`steps`/`definition-list`/`github-alerts`, and `tabs`/`steps` nest bidirectionally.
  - Type-aware: every package ships `.d.mts` declarations and externalizes `unist`/`mdast`/`hast` types so downstream consumers see compatible types.
  - Tested: 880 tests covering every plugin's syntax, plus cross-plugin integration tests for nested constructs (tabs-in-steps, attrs-on-defList, github-alerts-with-attrs, etc.).
  - Documented at [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown).
