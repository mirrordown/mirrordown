# Changelog






## 0.1.5
<sub>2026-07-02</sub>

- *(patch)*
  Add the sectionize plugin set: wraps each heading and the content beneath it — up to the next heading of equal or shallower depth — in a semantic `<section data-depth="N">` element, nesting deeper headings inside their ancestors' sections to mirror the document outline. Skipped heading levels nest gracefully (an `<h3>` under an `<h1>` becomes `data-depth="3"` with no invented `<h2>` section) and content before the first heading stays unwrapped. It only wraps and never touches heading ids, so it composes with `slug`/`autolink-headings` when run first. The markdown-it and remark plugins emit identical HTML. Also bundles the `markdown-sectionize` VSCode preview extension in the extension pack.
- *(patch)*
  Add the squeeze-paragraphs plugin set: removes empty (whitespace-only) paragraphs — those with no children or only whitespace text. CommonMark never emits an empty paragraph on its own, so this is a cleanup pass for residue left by other transforms (e.g. a comment stripper, or a plugin that lifts an element out of its wrapping paragraph); place it last in the pipeline to tidy that residue. The markdown-it and remark plugins emit identical HTML. Also bundles the `markdown-squeeze-paragraphs` VSCode preview extension in the extension pack.
- *(patch)*
  Fix an infinite loop / thrown error when `mdit-spoiler` and `mdit-sub` are both active and a document contains an unclosed `~` (e.g. `~15k`). `mdit-spoiler` replaces markdown-it's core `text` rule to make `|` a terminator, but at the inline boundary (`state.pos === state.posMax`) it returned `true` without advancing `state.pos`, violating markdown-it's rule contract — markdown-it 14 throws "inline rule didn't increment state.pos", while the older markdown-it bundled in VSCode's markdown preview caches the non-advancing result and loops forever, wedging the extension host. `mdit-sub`'s scan loop also probed one position too far (`<= max` instead of `< max`; `posMax` is exclusive), which is what reached the boundary. Both are fixed independently: `mdit-spoiler`'s `text` replacement now returns `false` when there is nothing to consume, and `mdit-sub` scans with `< max`. Adds a regression test that renders `about ~15k lines` with both plugins.

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
