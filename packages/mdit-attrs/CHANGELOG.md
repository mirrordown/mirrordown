# Changelog






## 0.2.1
<sub>2026-10-28</sub>

- *(patch)*
  The rule for which blocks a line of its own is written in now comes from `@mirrordown/core`, shared with the caption plugins, instead of a copy in each package.

## 0.2.0
<sub>2026-10-28</sub>

- *(minor)*
  Make `mdit-attrs` and `remd-attrs` render identical HTML, following markdown-it-attrs wherever the two disagreed. An attribute line lazily continuing a list's last item (`- a`, `- b`, `{.list}`) now applies to that list, including nested lists, in both engines; it was silently dropped. An attribute block on the line after a hard break now applies to the paragraph and keeps the `<br>` (`mdit-attrs` dropped the class, `remd-attrs` dropped the break). Text consisting only of an attribute block is no longer ignored by either engine's delimiter check. `remd-attrs` now supports attributes after a fence's language (` ```js {.x} `), on table cells (`td` and `th`), and at the end of loose and ordered list items. On fences, `class` is now always the first attribute in both engines (`mdit-attrs` wrote `id` before the language class).
- *(minor)*
  An attribute block on a line of its own now goes on the block it's written after, at the level its `>` markers and indentation put it, as kramdown places a block IAL. Written inside a blockquote or list item, it goes on the paragraph (`> para` then `> {.x}` gives `<p class="x">`), or on the item in a tight list (`- a` then `  {.x}` gives `<li class="x">`). Written outside one, as a lazy continuation line, it goes on that blockquote (`> para` then `{.x}`) or on the item's list (`- a` then `{.x}`), the outermost such block when it leaves several. Both plugins used to give the paragraph every line written inside a blockquote, and the list every line in a list item's first paragraph, whatever its indentation. markdown-it-attrs can't see indentation and gives the line to the outermost block ending with the paragraph; the cases where Mirrordown now differs from it are those where the indentation says otherwise. Inside tab panels and step bodies, the panel's own `>` belongs to the tab: a line written in the panel is placed as it would be at the top level.

  An attribute block right after an inline element now applies when text follows it, as in markdown-it-attrs: `**important**{.warning} text.` gives `<strong class="warning">`, where both plugins kept the block as text unless it ended the text run. Blocks that follow one another merge (`` `npm i`{.cmd}{#install} ``). In `remd-attrs`, inline blocks are also read in headings, table cells and nested elements, and before the heading and list item rules, so `# Title **b**{.x}` gives the `strong` the class, as `mdit-attrs` does. `{.a} {#b}` is no longer read as one block holding `.a} {#b`: only the last block ends the paragraph.
- *(patch)*
  Fixes for differences between the markdown-it and remark plugins that only show up when plugins are combined:

  - `mdit-attrs` no longer reads braces in an image's alt text as a trailing attribute block: `![{.cls}](x.png)` gave its paragraph `class="cls"`. Paragraph, heading and list item attributes now only come from literal text, as in `remd-attrs`.
  - `mdit-squeeze-paragraphs` now judges a paragraph empty by what it renders, as `remd-squeeze-paragraphs` does, so a paragraph that was only an attribute block (`{.note}`) is removed instead of kept as an empty `<p class="note">`.
  - `remd-github-alerts` builds its icons as hast elements instead of a `raw` node, so they render in a default unified pipeline instead of appearing as escaped `<svg>` text unless `allowDangerousHtml` was on. Both engines' icons now close their SVG elements explicitly (`<path …></path>`), which is how rehype serializes them by default.

## 0.1.3
<sub>2026-06-28</sub>

- *(patch)*
  Improve JSR package scores: add package descriptions, document all exported symbols (JSDoc), add READMEs for the inline-svg packages, clear slow-type errors on the exported hast handlers, and trim internal regex constants from the public API.

## 0.1.2
<sub>2026-06-28</sub>

- *(patch)*
  First publish to JSR (alongside npm). All 30 packages are claimed on the
  @mirrordown JSR scope with the repo linked, so `npx jsr publish` authenticates
  via GitHub Actions OIDC — no token. Publishes 0.1.2 to npm and JSR together.

## 0.1.1
<sub>2026-06-25</sub>

- *(patch)*
  fix: resolve `catalog:` protocol in published dependencies

  0.1.0 was published with Yarn's `catalog:` specifier left literally in
  `dependencies`/`devDependencies`, so consumers could not install the affected
  packages. Packages are now packed with `yarn pack` (which resolves `catalog:`
  to the concrete version ranges from `.yarnrc.yml`) before `npm publish`.

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
