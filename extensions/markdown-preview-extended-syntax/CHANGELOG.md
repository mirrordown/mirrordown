# Changelog





## 0.1.4
<sub>2026-07-01</sub>

- *(patch)*
  Add the spoiler plugin set: Discord-style `||spoiler||` click-to-reveal for inline content and images. Inline text becomes an obscured bar (per-line via `box-decoration-break`); wrap an image (`||![](…)||`) and it renders heavily blurred with a centered **SPOILER** pill, revealing the sharp image on click — Discord's image-spoiler treatment. The whole interaction is a `<label>` wrapping a visually-hidden checkbox and the content, revealed with the `:checked` sibling selector, so **no JavaScript runs** and it works in the VSCode preview. Keyboard-operable (Space) and announced as a spoiler control by screen readers. Combines with `lightbox` (`||!![](…)||`) for a spoilered image that is also click-to-zoom once revealed. The markdown-it and remark plugins emit identical HTML. Also bundles the `markdown-spoiler` VSCode preview extension in the extension pack.

## 0.1.3
<sub>2026-07-01</sub>

- *(patch)*
  Add Markdown Heading Anchors to the bundled extensions, so installing the pack now also adds hover-to-reveal anchor links on headings.

## 0.1.2
<sub>2026-06-29</sub>

- *(patch)*
  Add Markdown Image Lightbox to the bundled extensions, so installing the pack now also installs the `!!` click-to-zoom `<dialog>` lightbox.

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
