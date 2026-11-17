# Changelog






## 0.1.5
<sub>2026-11-17</sub>

- *(patch)*
  Fixes for edge cases where the three engines rendered `==highlighted==` text differently, or wrongly.

  - **An attribute block written right after a highlight goes on the `<mark>`** (Sätteri, with its `attributes` feature on).

    ```markdown
    ==a=={.x}
    ```

    Was `<p class="x"><mark>a</mark></p>`, and mid-paragraph the block stayed on the page as text. Now `<p><mark class="x">a</mark></p>`, as in markdown-it and remark.

  - **An escaped delimiter stays text after another plugin's span** (remark, Sätteri).

    ```markdown
    --a-- \==b==
    ```

    Was `<del>a</del> <mark>b</mark>`. Now `<del>a</del> ==b==`, as in markdown-it. The same holds after `++inserted++` text, a `[[key]]` and an abbreviation.

  - **An escape is still honoured after smart punctuation or an emoji reference** (remark, Sätteri). With Sätteri's smart punctuation on, `"q" \==a==` now keeps `==a==` as text.

    ```markdown
    &#x1F600; \==a==
    ```

    Was `😀 <mark>a</mark>`. Now `😀 ==a==`.

  - **An equals sign written as a character reference is not a delimiter** (remark, Sätteri).

    ```markdown
    &#61;=a==
    ```

    Was `<mark>a</mark>`. Now the text `==a==`.

  - **The text of an autolink is left alone** (remark, Sätteri).

    ```markdown
    <http://x.com/==a==>
    ```

    Was a link whose text read `http://x.com/<mark>a</mark>`. Now the link text is the URL as written.

  - **An escaped character or a character reference beside the equals signs counts as punctuation** (remark, Sätteri). This decides whether a pair of them can open or close.

    ```markdown
    \!==(a)==
    ```

    Was the text `!==(a)==`. Now `!<mark>(a)</mark>`, as in markdown-it.

  - **An abbreviation beside the equals signs is read as the word it is** (remark, Sätteri, with the abbr plugin).

    ```markdown
    *[HTML]: Hyper Text

    a==HTML==
    ```

    Now `a<mark><abbr title="Hyper Text">HTML</abbr></mark>`, as in markdown-it.

  - **A backslash line break right after the opening equals signs does not stop them from opening** (remark, Sätteri).

    ```markdown
    (==\
    a==
    ```

    Now `(<mark><br>a</mark>`, as in markdown-it.

  - **An emoji or other character outside the Basic Multilingual Plane beside the equals signs is read whole** (remark, Sätteri).

    ```markdown
    a==😀b==
    ```

    Now the text `a==😀b==`, as in markdown-it.

  - **Highlights nest up to 100 deep** (all engines). The markers of deeper ones stay text. Sätteri used to reject the whole document once spans nested deeper than 128, and remark could run out of stack on a few thousand levels.

  - **Private Use characters you typed are kept** (remark, Sätteri). Characters in the range U+F0021 to U+F007E, where some icon fonts put their glyphs, were rewritten to ASCII punctuation, in remark anywhere in the document, code blocks included.

  - **A long run of backslashes no longer slows the scan down** (remark, Sätteri). A line of them could take many seconds.

  The guide now lists the differences between engines that remain.

## 0.1.4
<sub>2026-10-28</sub>

- *(patch)*
  Backslash-escaped delimiters are now literal in `remd-mark`, `remd-ins`, `remd-del`, `remd-kbd`, `remd-spoiler`, `remd-sub` and `remd-sup`, as they already were in the `mdit-*` plugins: `\==not marked==` renders as `==not marked==` instead of a `<mark>`, while an escaped backslash (`\==marked==`) still allows the markup. These plugins now depend on the new `@mirrordown/core` package, which holds logic shared across Mirrordown's engines.
- *(patch)*
  `remd-mark` now runs its `==mark==` scan through `createDelimitedTransform` and `MARK_DELIMITERS` from `@mirrordown/core`, which the Sätteri plugin shares, and drops its `unist-util-find-*` and `unist-builder` dependencies. Its output is unchanged.
- *(patch)*
  `==mark==`, `++ins++` and `--del--` now pair delimiters the same way in every engine. `@mirrordown/core`'s `createDelimitedTransform` ports markdown-it's delimiter algorithm (the one markdown-it-mark and markdown-it-ins use), and the remark and Sätteri plugins run on it:

  - A closer pairs with the nearest opener: `==a ==b==` highlights only `b`, as markdown-it does.
  - Spans nest: `==a ==b== c==` is a highlight inside a highlight.
  - The extra marker of an odd-length run stays outside the span (`===a===` → `=<mark>a</mark>=`); `mdit-del` compared against `+` instead of `-` here, so its marker ended up inside.
  - `remd-del` no longer mishandles runs such as `--a --- b--` or `--+a+--`, which came from patterns copied from the ins plugin.

  New Sätteri plugins `@mirrordown/sat-ins` and `@mirrordown/sat-del`, also included in `@mirrordown/preset-satteri`. The `del` guide notes that smart punctuation, on by default in Astro, turns `--` into an en dash before the plugin runs.

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
