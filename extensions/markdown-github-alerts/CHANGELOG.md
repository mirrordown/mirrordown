# Changelog





## 0.2.0
<sub>2026-10-14</sub>

- *(minor)*
  Make `mdit-github-alerts` and `remd-github-alerts` render identical HTML. `remd` no longer drops the first paragraph of an alert when its first line contains formatting or its body starts with formatting (for example `> [!NOTE]` followed by `> **Bold** text`, which lost the whole body). The marker line now works the same in both engines: everything after `[!TYPE]` on the first line is the title, inline formatting included (`> [!NOTE] *Emphasized* title`), with its plain text (including inline code) as the `aria-label`; everything after the first line break, soft or hard, is the body. The icon SVG is no longer wrapped in a redundant `<span aria-hidden>` (`remd`), and a foldable-open alert emits a bare `open` attribute instead of `open=""` (`mdit`).
- *(patch)*
  Fixes for differences between the markdown-it and remark plugins that only show up when plugins are combined:

  - `mdit-attrs` no longer reads braces in an image's alt text as a trailing attribute block: `![{.cls}](x.png)` gave its paragraph `class="cls"`. Paragraph, heading and list item attributes now only come from literal text, as in `remd-attrs`.
  - `mdit-squeeze-paragraphs` now judges a paragraph empty by what it renders, as `remd-squeeze-paragraphs` does, so a paragraph that was only an attribute block (`{.note}`) is removed instead of kept as an empty `<p class="note">`.
  - `remd-github-alerts` builds its icons as hast elements instead of a `raw` node, so they render in a default unified pipeline instead of appearing as escaped `<svg>` text unless `allowDangerousHtml` was on. Both engines' icons now close their SVG elements explicitly (`<path …></path>`), which is how rehype serializes them by default.

## 0.1.3
<sub>2026-06-28</sub>

- *(patch)*
  Fix the alert accent border/background showing as neutral grey in the VSCode
  preview. VSCode 1.85+ styles `.markdown-alert` with unlayered rules that beat
  the plugin's `@layer`-scoped defaults; re-assert the accent unlayered in the
  extension's stylesheet (a host-integration concern, kept out of the plugin).

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
  Initial VSCode Marketplace release for the remaining syntax extensions and the
  extension pack, now that the vsce publish pipeline is proven (markdown-mark@0.1.1
  shipped cleanly).

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
