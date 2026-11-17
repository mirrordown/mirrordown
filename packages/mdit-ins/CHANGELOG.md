# Changelog





## 0.1.4
<sub>2026-11-17</sub>

- *(patch)*
  Fixes for edge cases where the three engines rendered `++inserted++` text differently, or wrongly.

  - **An attribute block written right after an insertion goes on the `<ins>`** (Sätteri, with its `attributes` feature on).

    ```markdown
    text ++a++{.new} more
    ```

    Was `text <ins>a</ins>{.new} more`, and at the end of a paragraph the class went on the `<p>`. Now `text <ins class="new">a</ins> more`, as in markdown-it and remark.

  - **An escaped delimiter stays text after another plugin's span** (remark, Sätteri).

    ```markdown
    --a-- \++b++
    ```

    Was `<del>a</del> <ins>b</ins>`. Now `<del>a</del> ++b++`, as in markdown-it.

  - **An escape is still honoured after smart punctuation or an emoji reference** (remark, Sätteri). With Sätteri's smart punctuation on, `"q" \++a++` now keeps `++a++` as text.

    ```markdown
    &#x1F600; \++a++
    ```

    Was `😀 <ins>a</ins>`. Now `😀 ++a++`.

  - **A plus written as a character reference is not a delimiter** (remark, Sätteri).

    ```markdown
    &#43;+a++
    ```

    Was `<ins>a</ins>`. Now the text `++a++`.

  - **The text of an autolink is left alone** (remark, Sätteri).

    ```markdown
    <http://x.y/++b++>
    ```

    Was a link whose text read `http://x.y/<ins>b</ins>`. Now the link text is the URL as written.

  - **An escaped character or a character reference beside the pluses counts as punctuation** (remark, Sätteri). This decides whether a pair of pluses can open or close.

    ```markdown
    x++\*a++
    ```

    Was `x<ins>*a</ins>`. Now the text `x++*a++`, as in markdown-it.

  - **An abbreviation beside the pluses is read as the word it is** (remark, Sätteri, with the abbr plugin).

    ```markdown
    *[HTML]: Hyper Text Markup Language

    a++HTML++
    ```

    Was `a++<abbr …>HTML</abbr>++`. Now `a<ins><abbr …>HTML</abbr></ins>`, as in markdown-it.

  - **A backslash line break right after the opening pluses does not stop them from opening** (remark, Sätteri).

    ```markdown
    (++\
    a++
    ```

    Now `(<ins><br>a</ins>`, as in markdown-it.

  - **An emoji or other character outside the Basic Multilingual Plane beside the pluses is read whole** (remark, Sätteri).

    ```markdown
    a++😀b++
    ```

    Now the text `a++😀b++`, as in markdown-it.

  - **Insertions nest up to 100 deep** (all engines). The markers of deeper ones stay text. Sätteri used to reject the whole document once spans nested deeper than 128, while markdown-it and remark rendered every level.

  - **Private Use characters you typed are kept** (remark, Sätteri). Characters in the range U+F0021 to U+F007E, where some icon fonts put their glyphs, were rewritten to ASCII punctuation, in remark anywhere in the document, code blocks included.

  - **A long run of backslashes no longer slows the scan down** (remark, Sätteri). A line of them could take many seconds.

  The guide now lists the differences between engines that remain.

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
