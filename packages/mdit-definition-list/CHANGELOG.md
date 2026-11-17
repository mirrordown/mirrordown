# Changelog







## 0.2.2
<sub>2026-11-17</sub>

- *(patch)*
  Fixes for input that markdown-it and remark turned into different definition lists, or into a list where there is none.

  - **A heading, list item, blockquote, code fence or thematic break after a definition is not another term** (markdown-it).

    ```markdown
    T
    : D

    # H
    : D2
    ```

    Was `<dt># H</dt><dd>D2</dd>` in the same list. Now the list ends after `D`, followed by `<h1>H</h1><p>: D2</p>`, as in remark. The same goes for `- item`, `> q`, a fence (its lines were read as a term and a definition), `***`, indented code, a link reference definition and, with `html: true`, a line that is an HTML tag.

  - **The marker line wins over a setext underline** (markdown-it).

    ```markdown
    Term
    : Def
    ---
    ```

    Was the heading `<h2>Term\n: Def</h2>`. Now `<dl><dt>Term</dt><dd>Def</dd></dl><hr>`, as in remark. With `===` the line is text in the definition.

  - **A blank line between a term and its marker keeps the term in the list, inside a blockquote** (remark).

    ```markdown
    > Term
    >
    > : Def
    ```

    Was `<p>Term</p><dl><dd>Def</dd></dl>`, a list without a term. Now `<dl><dt>Term</dt><dd><p>Def</p></dd></dl>`, as in markdown-it.

  - **A blank line before a marker makes the definition loose when the marker is indented or in a list item** (remark).

    ```markdown
    - Term

      : Def
    ```

    Was `<dd>Def</dd>`. Now `<dd><p>Def</p></dd>`, as in markdown-it. The same goes for a marker indented at the top level and for a nested definition.

  - **A blank line inside a nested list does not make the definition loose** (remark).

    ```markdown
    T
    : para
      - a

        b
    ```

    Was `<dd><p>para</p><ul><li>a</li></ul><p>b</p></dd>`, with `b` outside the list. Now `<dd>para\n<ul><li><p>a</p><p>b</p></li></ul></dd>`, as in markdown-it. A blank line between the items of a nested list, or inside a fenced code block, no longer wraps `para` in `<p>` either.

  - **A marker indented four columns or more is not a marker** (markdown-it).

    ```markdown
    Term
        : Def
    ```

    Was a definition list. Now `<p>Term\n: Def</p>`, as in remark; after a blank line the line is indented code.

  - **The definition after an empty one stays tight** (remark).

    ```markdown
    T
    :
    : D
    ```

    Was `<dd></dd><dd><p>D</p></dd>`. Now `<dd></dd><dd>D</dd>`, as in markdown-it.

  - **A marker on a continuation line of a nested definition nests one level deeper** (remark).

    ```markdown
    a
    : b
      : c
        : d
    ```

    Was `c` and `d` as two definitions of `b`. Now `d` is the definition of the term `c`, nested in the definition of `b`, as in markdown-it.

  - **With GFM tables, a row that starts with `:` right after the delimiter row stays in the table** (remark).

    ```markdown
    | a |
    | - |
    : D2
    ```

    Was a table without a body, followed by `<p>: D2</p>`. Now `: D2` is the table's first body row, as in markdown-it and as without the plugin.

  - **A marker under a definition's nested list item continues the item's paragraph** (markdown-it).

    ```markdown
    T
    : - a
      : x
    ```

    Was `<ul><li>a</li></ul>` followed by the text `: x`. Now `<li>a\n: x</li>`, as in remark.

  - **A tab after the marker inside a blockquote sets the right content column** (markdown-it). A second paragraph indented two columns under `> :`, a tab, then text fell out of the definition; it is now part of it, as in remark.

  - **`remarkDefinitionList` renders `<dl>`, `<dt>` and `<dd>` even when `defListHastHandlers` is not passed to `remark-rehype`.** It rendered three nested `<div>` elements.

  The guide's markdown-it example now imports the name the package exports, `dl`, and has a section on where Sätteri's built-in definition lists differ.

## 0.2.1
<sub>2026-10-28</sub>

- *(patch)*
  `mdit-definition-list` now requires continuation lines to reach a definition's content column, as `remd-definition-list` does: one column past the marker plus the spaces after it (`:   Red.` needs four spaces), or a single space when the marker ends the line or is followed by more than four spaces, in which case the rest is an indented code block. It previously accepted any continuation indented two columns past the marker.

## 0.2.0
<sub>2026-10-14</sub>

- *(minor)*
  Align definition lists with Pandoc. Looseness is now decided per definition: a `<dd>` wraps its content in `<p>` only when a blank line directly precedes its own marker or separates blocks inside it, instead of one loose definition loosening the whole list (`mdit`) or its whole group (`remd`). A bare marker (`:` or `~` followed by nothing but whitespace) now opens an empty `<dd>` instead of leaving the line as paragraph text. Both behaviors match Pandoc, `remark-definition-list`, `@mdit/plugin-dl`, and Sätteri. `remd-definition-list` also fixes three parsing bugs that previously had their own remark-only test expectations: a definition list inside a list item is now recognized, and a `:` line that does not continue the blockquote or list item holding the term is now a lazy paragraph continuation rather than a new definition. Both plugins now share a single set of expected outputs.

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
