# Changelog





## 0.2.0
<sub>2026-10-28</sub>

- *(minor)*
  Make `mdit-tabs` and `remd-tabs` render identical HTML. `remd-tabs` no longer drops a depth-skipping header line (`% Tab One` followed by `%%% Too Deep`) and pulls the following content into the previous tab: the skipped-depth line now ends the group and renders as an ordinary paragraph, and a depth-1 header after it starts a new group, as in `mdit-tabs`. `remd-tabs` also splits a tab header that a nested blockquote lazily absorbed (`> > quote` followed by `% Tab Two`), which previously merged the next tab into the quote. `mdit-tabs` now emits the radio inputs' `hidden` and `checked` attributes bare, as `remd-tabs` does, instead of `hidden=""` and `checked=""`.
- *(minor)*
  Tab labels behave the same in every engine:

  - `remd-tabs` keeps a tab's label in the tree, as a `tabsLabel` node that is the first child of each `tabsItem` (the `label` field is gone), so remark plugins that run after it also apply to the label, and a panel's `aria-label` is the label's final text.
  - `data-tabs-group` hashes each label's plain text without a trailing attrs block, as the tabs specification describes. `mdit-tabs` hashed the raw markdown, so labels with links, images, entities or escapes got different ids in markdown-it and remark; labels with a trailing `{…}` change id in both.
  - `mdit-tabs` escapes a panel's `aria-label` once: `npm & yarn` rendered as `aria-label="npm &amp;amp; yarn"`.
  - `mdit-tabs` nests its panel tokens inside the tabs tokens, so `mdit-sectionize` no longer opens a `<section>` around a heading in a tab panel that closed outside the panel.
- *(minor)*
  Tab groups nested in step bodies and other containers work in every engine:

  - Block ids (the radio `name` and input ids) number the document's tab groups in the order they open, combined with the group id, instead of hashing a start line that nested groups don't reliably have. Two groups with the same labels in different steps shared radio names, so the first loaded with no panel open and the second's tabs switched the first. Ids of the first group on a page are unchanged; later groups' ids change. Core exports `tabsBlockId`, and `TabsListNode` no longer carries a `blockId`.
  - `mdit-tabs` keeps a group together across blank lines inside a container (a step body, tab panel, blockquote or list item) when another entry follows, as `remd-tabs` does: the empty `>` lines between entries are the container's own. At the top level a blank line still ends a group.
- *(patch)*
  A tab header written right after nested tab content (`> > Option C body.` then `% Code`) starts a tab in the outer group in every engine. CommonMark lazily continues the nested paragraph with it, so the remark and Sätteri plugins put it in the inner group (the tabs guide's own "Default open tab" demo showed `Code` beside `Option C`); they now read the source's `>` markers as markdown-it does, keeping the header at the depth it was written with and the blockquote structure of the lines after it. `processTabs` takes the document's source for this; the marker handling is shared with steps.
- *(patch)*
  A tab header that skips a level no longer loses content in the remark and Sätteri plugins, which dropped it and its body; they now render it as `mdit-tabs` does. In a tab's explicit `> %` body it stays in that panel as text, after any group nested there; in a group of plain `>` bodies it ends the group, and it and the lines after it follow the group as ordinary content, with the blockquotes their `>` markers give. A panel's content now also renders in document order in both plugins, rather than its body before its nested groups.
- *(patch)*
  Paragraphs in tab panels and step bodies keep what they had when recognition splits them around a header:

  - A hard break (`line\` then `more`) stays a `<br>` in `remd-tabs`, `remd-steps`, `sat-tabs` and `sat-steps`; it became a plain line break, unlike in `mdit-tabs` and `mdit-steps`.
  - Text split around a header keeps its source position, and the lines left together are one text node again, as remark gives them.
  - In `sat-tabs` and `sat-steps`, a paragraph keeps the attributes Sätteri read from its end. A header right after a panel's last paragraph continues that paragraph in CommonMark, so Sätteri saw the paragraph's attribute block mid-paragraph; with Sätteri's `attributes` feature on, the plugins now place that block once the header is split off, where Sätteri would have.
  - `mdit-tabs` and `mdit-steps` give the panel's opening token its body as `meta.attrsSource`, since the tokens inside index the body's lines, so `mdit-attrs` can read a line's indentation there.

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
