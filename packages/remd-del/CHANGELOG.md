# Changelog








## 0.1.7
<sub>2026-11-26</sub>

- *(patch)*
  New plugin set `cjk-friendly` for markdown-it and remark: emphasis and every other delimiter open and close beside Chinese, Japanese and Korean punctuation. The two presets turn it on by default. Sätteri resolves emphasis in its parser and does not have the rule yet.

  - **New: `@mirrordown/mdit-cjk-friendly` and `@mirrordown/remd-cjk-friendly`.** CommonMark decides whether `**` can open or close by the characters around it, with rules written for languages that put spaces between words. Beside CJK punctuation they fail. The plugins implement the [CommonMark CJK-friendly Amendments](https://github.com/tats-u/markdown-cjk-friendly/blob/main/specification.md).

    ```markdown
    **テスト。**テスト

    これは**「重要」**です

    **이름(Name)**은 필수입니다
    ```

    Was `<p>**テスト。**テスト</p>`, `<p>これは**「重要」**です</p>` and `<p>**이름(Name)**은 필수입니다</p>`. Now `<p><strong>テスト。</strong>テスト</p>`, `<p>これは<strong>「重要」</strong>です</p>` and `<p><strong>이름(Name)</strong>은 필수입니다</p>`.

  - **Strikethrough and the Mirrordown delimiters take the same rule.** `~~`, `==`, `++`, `--`, `||`, `~` and `^` are flanked as emphasis is, so they failed in the same places.

    ```markdown
    ~~削除。~~テスト

    これは==「重要」==です
    ```

    Was text in both. Now `<p><del>削除。</del>テスト</p>` (`<s>` in markdown-it) and `<p>これは<mark>「重要」</mark>です</p>`. In remark, `remd-mark`, `remd-ins`, `remd-del`, `remd-spoiler`, `remd-sub` and `remd-sup` read whether `remarkCjkFriendly` is in the processor, in any plugin order; without it they render as before.

  - **Text without CJK characters is unchanged**, with one exception the specification makes on purpose: punctuation followed by a variation selector is read as punctuation.

    ```markdown
    a**"b"**c

    **a.**b
    ```

    Both stay text, as in CommonMark.

  - **Presets: `cjkFriendly`, on by default** in `@mirrordown/preset-markdown-it` and `@mirrordown/preset-remark`. Turn it off with `cjkFriendly: false`. `@mirrordown/preset-satteri` has no such option yet.

  - **`@mirrordown/core`** decides every delimiter's flanking in one function, `delimiterFlanking`, with the amendment as an option. `createDelimitedTransform` and `scriptSyntax` take an optional reader that says whether it is on.

## 0.1.6
<sub>2026-11-24</sub>

- *(patch)* Updated dependency `@mirrordown/core` v0.3.0

## 0.1.5
<sub>2026-11-17</sub>

- *(patch)*
  Fixes for edge cases where the three engines rendered `--deleted--` text differently, or wrongly.

  - **An attribute block written right after a deletion goes on the `<del>`** (Sätteri, with its `attributes` feature on).

    ```markdown
    --deleted--{.removed}
    ```

    Was `<p class="removed"><del>deleted</del></p>`, and mid-paragraph the block stayed on the page as text. Now `<p><del class="removed">deleted</del></p>`, as in markdown-it and remark.

  - **An escaped delimiter stays text after a deletion earlier in the paragraph** (remark, Sätteri).

    ```markdown
    --a-- \==b==
    ```

    Was `<del>a</del> <mark>b</mark>`. Now `<del>a</del> ==b==`, as in markdown-it. The same holds for `\++`, `\||` and `\[[` when those plugins run after this one.

  - **A dash written as a character reference is not a delimiter** (remark, Sätteri).

    ```markdown
    &#45;-a--
    ```

    Was `<del>a</del>`. Now the text `--a--`.

  - **The text of an autolink is left alone** (remark, Sätteri).

    ```markdown
    <http://x.com/--a-->
    ```

    Was a link whose text read `http://x.com/<del>a</del>`. Now the link text is the URL as written.

  - **An escaped character or a character reference beside the dashes counts as punctuation** (remark, Sätteri). This decides whether a pair of dashes can open or close.

    ```markdown
    a--\*b--
    ```

    Was `a<del>*b</del>`. Now the text `a--*b--`, as in markdown-it. In the other direction, `--a&nbsp;--` was text and is now a deletion.

  - **An escape is still honoured after an emoji written as a character reference** (remark, Sätteri).

    ```markdown
    &#x1F600; \--a--
    ```

    Was `😀 <del>a</del>`. Now `😀 --a--`.

  - **An abbreviation beside the dashes is read as the word it is** (remark, Sätteri, with the abbr plugin).

    ```markdown
    *[HTML]: Hyper Text

    --(a)--HTML
    ```

    Was `<del>(a)</del><abbr title="Hyper Text">HTML</abbr>`. Now `--(a)--<abbr title="Hyper Text">HTML</abbr>`, as in markdown-it.

  - **A backslash line break right after the opening dashes does not stop them from opening** (remark, Sätteri).

    ```markdown
    (--\
    a--
    ```

    Was `(--<br>a--`. Now `(<del><br>a</del>`, as in markdown-it.

  - **An emoji or other character outside the Basic Multilingual Plane beside the dashes is read whole** (remark, Sätteri).

    ```markdown
    a--😀b--
    ```

    Was `a<del>😀b</del>`. Now the text `a--😀b--`, as in markdown-it.

  - **Deletions nest up to 100 deep** (all engines). The markers of deeper ones stay text. Sätteri used to reject the whole document once spans nested deeper than 128, while markdown-it and remark rendered every level.

  - **Private Use characters you typed are kept** (remark, Sätteri). Characters in the range U+F0021 to U+F007E, where some icon fonts put their glyphs, were rewritten to ASCII punctuation, in remark anywhere in the document, code blocks included.

  - **A long run of backslashes no longer slows the scan down** (remark, Sätteri). A line of them could take many seconds.

  The guide now lists the differences between engines that remain.

## 0.1.4
<sub>2026-10-28</sub>

- *(patch)*
  Backslash-escaped delimiters are now literal in `remd-mark`, `remd-ins`, `remd-del`, `remd-kbd`, `remd-spoiler`, `remd-sub` and `remd-sup`, as they already were in the `mdit-*` plugins: `\==not marked==` renders as `==not marked==` instead of a `<mark>`, while an escaped backslash (`\==marked==`) still allows the markup. These plugins now depend on the new `@mirrordown/core` package, which holds logic shared across Mirrordown's engines.
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
