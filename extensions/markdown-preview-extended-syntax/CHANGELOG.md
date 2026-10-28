# Changelog










## 0.1.9
<sub>2026-10-28</sub>

- *(patch)*
  Add Markdown Tab Icons to the bundled extensions, so installing the pack now also renders icons in tab labels in the preview.

## 0.1.8
<sub>2026-10-28</sub>

- *(patch)*
  Add Markdown Mermaid Diagrams (Pele) to the bundled extensions, so installing the pack now also renders ` ```mermaid ` code blocks as diagrams in the preview.
- *(patch)* Add Markdown Captions to the bundled extensions, so installing the pack now also renders `~:` captions in the preview.

## 0.1.7
<sub>2026-10-28</sub>

- *(patch)*
  Make `mdit-github-alerts` and `remd-github-alerts` render identical HTML. `remd` no longer drops the first paragraph of an alert when its first line contains formatting or its body starts with formatting (for example `> [!NOTE]` followed by `> **Bold** text`, which lost the whole body). The marker line now works the same in both engines: everything after `[!TYPE]` on the first line is the title, inline formatting included (`> [!NOTE] *Emphasized* title`), with its plain text (including inline code) as the `aria-label`; everything after the first line break, soft or hard, is the body. The icon SVG is no longer wrapped in a redundant `<span aria-hidden>` (`remd`), and a foldable-open alert emits a bare `open` attribute instead of `open=""` (`mdit`).
- *(patch)*
  Make `mdit-tabs` and `remd-tabs` render identical HTML. `remd-tabs` no longer drops a depth-skipping header line (`% Tab One` followed by `%%% Too Deep`) and pulls the following content into the previous tab: the skipped-depth line now ends the group and renders as an ordinary paragraph, and a depth-1 header after it starts a new group, as in `mdit-tabs`. `remd-tabs` also splits a tab header that a nested blockquote lazily absorbed (`> > quote` followed by `% Tab Two`), which previously merged the next tab into the quote. `mdit-tabs` now emits the radio inputs' `hidden` and `checked` attributes bare, as `remd-tabs` does, instead of `hidden=""` and `checked=""`.
- *(patch)*
  Make `remd-steps` render the same HTML as `mdit-steps`. A step header that skips a depth level (`@1. Step one` followed by `@@@1. Too Deep`) or a plain line inside a run of step headers no longer silently disappears with the following content pulled into the previous step: the group ends at that line, which renders as an ordinary paragraph, and a depth-1 header after it starts a new group.
- *(patch)*
  `remd-inline-svg` now gives an inlined `<svg>` its accessible name through `aria-label`, taken from the image's alt text, as `mdit-inline-svg` does. It previously copied `alt` onto the `<svg>`, where it is not a valid attribute, and wrote `alt=""` for images without alt text; an empty alt now adds no attribute.
- *(patch)*
  `remd-inline-svg` now inserts the SVG file's markup verbatim as a `raw` node instead of parsing it into hast elements, so its output is byte-for-byte the same as `mdit-inline-svg` (previously hast re-serialized the SVG, rewriting values such as `fill-opacity=".5"` to `"0.5"` and `<path/>` to `<path></path>`). **Breaking:** `rehype-stringify` now needs `allowDangerousHtml: true`, and later rehype plugins see the inlined SVG as an opaque string rather than an element tree. With `deduplication`, the hidden sprite is now emitted right before the first `<use>` reference, as in `mdit-inline-svg`, instead of at the start of the document.

  Both packages: with `deduplication`, sprite ids are now derived from the SVG's path relative to the document instead of its absolute path, so the same document produces the same ids on every machine and OS.
- *(patch)*
  Make `mdit-attrs` and `remd-attrs` render identical HTML, following markdown-it-attrs wherever the two disagreed. An attribute line lazily continuing a list's last item (`- a`, `- b`, `{.list}`) now applies to that list, including nested lists, in both engines; it was silently dropped. An attribute block on the line after a hard break now applies to the paragraph and keeps the `<br>` (`mdit-attrs` dropped the class, `remd-attrs` dropped the break). Text consisting only of an attribute block is no longer ignored by either engine's delimiter check. `remd-attrs` now supports attributes after a fence's language (` ```js {.x} `), on table cells (`td` and `th`), and at the end of loose and ordered list items. On fences, `class` is now always the first attribute in both engines (`mdit-attrs` wrote `id` before the language class).
- *(patch)*
  `mdit-definition-list` now requires continuation lines to reach a definition's content column, as `remd-definition-list` does: one column past the marker plus the spaces after it (`:   Red.` needs four spaces), or a single space when the marker ends the line or is followed by more than four spaces, in which case the rest is an indented code block. It previously accepted any continuation indented two columns past the marker.
- *(patch)*
  A ruby annotation inside image alt text now stays verbatim in the `alt` attribute (`![{word|reading}](image.png)` renders `alt="{word|reading}"`) in both engines. Alt text is an attribute and renders no markup, so the characters reach it exactly as written; `mdit-ruby` produced `alt="wordreading"` and `remd-ruby` an empty `alt`.
- *(patch)*
  Backslash-escaped delimiters are now literal in `remd-mark`, `remd-ins`, `remd-del`, `remd-kbd`, `remd-spoiler`, `remd-sub` and `remd-sup`, as they already were in the `mdit-*` plugins: `\==not marked==` renders as `==not marked==` instead of a `<mark>`, while an escaped backslash (`\==marked==`) still allows the markup. These plugins now depend on the new `@mirrordown/core` package, which holds logic shared across Mirrordown's engines.
- *(patch)*
  An attribute block on a line of its own now goes on the block it's written after, at the level its `>` markers and indentation put it, as kramdown places a block IAL. Written inside a blockquote or list item, it goes on the paragraph (`> para` then `> {.x}` gives `<p class="x">`), or on the item in a tight list (`- a` then `  {.x}` gives `<li class="x">`). Written outside one, as a lazy continuation line, it goes on that blockquote (`> para` then `{.x}`) or on the item's list (`- a` then `{.x}`), the outermost such block when it leaves several. Both plugins used to give the paragraph every line written inside a blockquote, and the list every line in a list item's first paragraph, whatever its indentation. markdown-it-attrs can't see indentation and gives the line to the outermost block ending with the paragraph; the cases where Mirrordown now differs from it are those where the indentation says otherwise. Inside tab panels and step bodies, the panel's own `>` belongs to the tab: a line written in the panel is placed as it would be at the top level.

  An attribute block right after an inline element now applies when text follows it, as in markdown-it-attrs: `**important**{.warning} text.` gives `<strong class="warning">`, where both plugins kept the block as text unless it ended the text run. Blocks that follow one another merge (`` `npm i`{.cmd}{#install} ``). In `remd-attrs`, inline blocks are also read in headings, table cells and nested elements, and before the heading and list item rules, so `# Title **b**{.x}` gives the `strong` the class, as `mdit-attrs` does. `{.a} {#b}` is no longer read as one block holding `.a} {#b`: only the last block ends the paragraph.
- *(patch)*
  Paragraphs in tab panels and step bodies keep what they had when recognition splits them around a header:

  - A hard break (`line\` then `more`) stays a `<br>` in `remd-tabs`, `remd-steps`, `sat-tabs` and `sat-steps`; it became a plain line break, unlike in `mdit-tabs` and `mdit-steps`.
  - Text split around a header keeps its source position, and the lines left together are one text node again, as remark gives them.
  - In `sat-tabs` and `sat-steps`, a paragraph keeps the attributes Sätteri read from its end. A header right after a panel's last paragraph continues that paragraph in CommonMark, so Sätteri saw the paragraph's attribute block mid-paragraph; with Sätteri's `attributes` feature on, the plugins now place that block once the header is split off, where Sätteri would have.
  - `mdit-tabs` and `mdit-steps` give the panel's opening token its body as `meta.attrsSource`, since the tokens inside index the body's lines, so `mdit-attrs` can read a line's indentation there.

## 0.1.6
<sub>2026-10-14</sub>

- *(patch)*
  Align definition lists with Pandoc. Looseness is now decided per definition: a `<dd>` wraps its content in `<p>` only when a blank line directly precedes its own marker or separates blocks inside it, instead of one loose definition loosening the whole list (`mdit`) or its whole group (`remd`). A bare marker (`:` or `~` followed by nothing but whitespace) now opens an empty `<dd>` instead of leaving the line as paragraph text. Both behaviors match Pandoc, `remark-definition-list`, `@mdit/plugin-dl`, and Sätteri. `remd-definition-list` also fixes three parsing bugs that previously had their own remark-only test expectations: a definition list inside a list item is now recognized, and a `:` line that does not continue the blockquote or list item holding the term is now a lazy paragraph continuation rather than a new definition. Both plugins now share a single set of expected outputs.

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
