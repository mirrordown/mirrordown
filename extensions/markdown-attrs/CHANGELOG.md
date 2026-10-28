# Changelog




## 0.2.0
<sub>2026-10-28</sub>

- *(minor)*
  Make `mdit-attrs` and `remd-attrs` render identical HTML, following markdown-it-attrs wherever the two disagreed. An attribute line lazily continuing a list's last item (`- a`, `- b`, `{.list}`) now applies to that list, including nested lists, in both engines; it was silently dropped. An attribute block on the line after a hard break now applies to the paragraph and keeps the `<br>` (`mdit-attrs` dropped the class, `remd-attrs` dropped the break). Text consisting only of an attribute block is no longer ignored by either engine's delimiter check. `remd-attrs` now supports attributes after a fence's language (` ```js {.x} `), on table cells (`td` and `th`), and at the end of loose and ordered list items. On fences, `class` is now always the first attribute in both engines (`mdit-attrs` wrote `id` before the language class).
- *(minor)*
  An attribute block on a line of its own now goes on the block it's written after, at the level its `>` markers and indentation put it, as kramdown places a block IAL. Written inside a blockquote or list item, it goes on the paragraph (`> para` then `> {.x}` gives `<p class="x">`), or on the item in a tight list (`- a` then `  {.x}` gives `<li class="x">`). Written outside one, as a lazy continuation line, it goes on that blockquote (`> para` then `{.x}`) or on the item's list (`- a` then `{.x}`), the outermost such block when it leaves several. Both plugins used to give the paragraph every line written inside a blockquote, and the list every line in a list item's first paragraph, whatever its indentation. markdown-it-attrs can't see indentation and gives the line to the outermost block ending with the paragraph; the cases where Mirrordown now differs from it are those where the indentation says otherwise. Inside tab panels and step bodies, the panel's own `>` belongs to the tab: a line written in the panel is placed as it would be at the top level.

  An attribute block right after an inline element now applies when text follows it, as in markdown-it-attrs: `**important**{.warning} text.` gives `<strong class="warning">`, where both plugins kept the block as text unless it ended the text run. Blocks that follow one another merge (`` `npm i`{.cmd}{#install} ``). In `remd-attrs`, inline blocks are also read in headings, table cells and nested elements, and before the heading and list item rules, so `# Title **b**{.x}` gives the `strong` the class, as `mdit-attrs` does. `{.a} {#b}` is no longer read as one block holding `.a} {#b`: only the last block ends the paragraph.

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
