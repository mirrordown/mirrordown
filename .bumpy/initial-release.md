---
"@saeris/mdit-abbr": minor
"@saeris/mdit-attrs": minor
"@saeris/mdit-definition-list": minor
"@saeris/mdit-del": minor
"@saeris/mdit-github-alerts": minor
"@saeris/mdit-inline-svg": minor
"@saeris/mdit-ins": minor
"@saeris/mdit-kbd": minor
"@saeris/mdit-mark": minor
"@saeris/mdit-ruby": minor
"@saeris/mdit-steps": minor
"@saeris/mdit-sub": minor
"@saeris/mdit-sup": minor
"@saeris/mdit-tabs": minor
"@saeris/mdit-unwrap-images": minor
"@saeris/remd-abbr": minor
"@saeris/remd-attrs": minor
"@saeris/remd-definition-list": minor
"@saeris/remd-del": minor
"@saeris/remd-github-alerts": minor
"@saeris/remd-inline-svg": minor
"@saeris/remd-ins": minor
"@saeris/remd-kbd": minor
"@saeris/remd-mark": minor
"@saeris/remd-ruby": minor
"@saeris/remd-steps": minor
"@saeris/remd-sub": minor
"@saeris/remd-sup": minor
"@saeris/remd-tabs": minor
"@saeris/remd-unwrap-images": minor
"markdown-abbr": minor
"markdown-attrs": minor
"markdown-definition-list": minor
"markdown-del": minor
"markdown-denden-furigana": minor
"markdown-github-alerts": minor
"markdown-inline-svg": minor
"markdown-ins": minor
"markdown-kbd": minor
"markdown-mark": minor
"markdown-preview-extended-syntax": minor
"markdown-steps": minor
"markdown-sub": minor
"markdown-sup": minor
"markdown-tabs": minor
"markdown-unwrap-images": minor
---

# Initial release

First public release of the `@saeris/markdown` suite — a collection of markdown syntax extensions for the [unified](https://unifiedjs.com/) (remark/rehype) and [markdown-it](https://github.com/markdown-it/markdown-it) ecosystems.

## Packages

**Remark/rehype plugins** (`@saeris/remd-*`):

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

**Markdown-it plugins** (`@saeris/mdit-*`): same plugin set, ported for the markdown-it pipeline.

**VSCode extensions** (`markdown-*`): each plugin wrapped as a VSCode extension that contributes its syntax to the built-in markdown preview. (Publishing to the VSCode Marketplace is wired separately and is not part of this npm release.)

## Highlights

- Designed to work together — `attrs` understands custom container nodes from `tabs`/`steps`/`definition-list`/`github-alerts`, and `tabs`/`steps` nest bidirectionally.
- Type-aware: every package ships `.d.mts` declarations and externalizes `unist`/`mdast`/`hast` types so downstream consumers see compatible types.
- Tested: 880 tests covering every plugin's syntax, plus cross-plugin integration tests for nested constructs (tabs-in-steps, attrs-on-defList, github-alerts-with-attrs, etc.).
- Documented at [saeris.github.io/markdown](https://saeris.github.io/markdown).
