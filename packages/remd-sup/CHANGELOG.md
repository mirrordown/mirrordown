# Changelog








## 0.2.3
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
- *(patch)*
  remark reads a character outside the Basic Multilingual Plane beside a delimiter run as the whole character it is, as markdown-it and Sätteri do.

  - **An emoji or a symbol beside `*`, `_` or `~~` is punctuation in remark, with `remd-cjk-friendly`.** micromark classifies the character beside a run one code unit at a time, and a character outside the BMP is two, so it took every emoji and mathematical symbol for a letter. CommonMark counts symbols as punctuation, and markdown-it and Sätteri read them so.

    ```markdown
    🎉**"a"**

    a**a𝜵**a
    ```

    Was, in remark, `<p>🎉**"a"**</p>` and `<p>a<strong>a𝜵</strong>a</p>`. Now `<p>🎉<strong>"a"</strong></p>` and `<p>a**a𝜵**a</p>`, as markdown-it and Sätteri render them. The remark preset has the plugin on by default; without it, remark's emphasis is micromark's own and reads as before.

  - **`remd-sub` and `remd-sup` read it the same way, with or without other plugins**, as `mdit-sub` and `mdit-sup` do.

    ```markdown
    🎉~"a"~

    a^a𝜵^a
    ```

    Was `<p>🎉~"a"~</p>` and `<p>a<sup>a𝜵</sup>a</p>`. Now `<p>🎉<sub>"a"</sub></p>` and `<p>a^a𝜵^a</p>`.

  - **Half a surrogate pair beside a run is read as U+FFFD**, a symbol, which is what markdown-it reads in its place.

  - A letter outside the BMP, such as `𠮷`, is a letter as before, and so is every character inside it.

## 0.2.2
<sub>2026-11-24</sub>

- *(patch)* Updated dependency `@mirrordown/core` v0.3.0

## 0.2.1
<sub>2026-11-17</sub>

- *(patch)*
  No change to what `^superscript^` renders. The guide now states what Sätteri's built-in superscript does differently, and that a footnote-style reference with no definition (`[^1] x^2^`) opens a superscript in every engine.

## 0.2.0
<sub>2026-10-28</sub>

- *(minor)*
  `~subscript~` and `^superscript^` now parse the same way in markdown-it, remark and Sätteri: a single `~` or `^` is a delimiter run with emphasis-style flanking, its content is inline markup (spaces, emphasis, links, code and each other), and crossing runs resolve leftmost-first.

  - `mdit-sub` and `mdit-sup` used to keep the content as plain text and reject any space inside it. They now parse it as inline markup, so `~*a* b~` renders emphasis and `^a~b~c^` nests.
  - `remd-sub` and `remd-sup` are now micromark syntax extensions sharing one resolver from `@mirrordown/core` (`scriptSyntax`), instead of text scans run one after another. Crossing runs such as `^a~b^c~` no longer depend on which plugin was registered first, `~~a~~` without GFM is no longer turned into empty subscripts, and the packages drop their `unist-util-*` dependencies.
  - The sub guide now shows `remark-gfm` with `singleTilde: false`: GFM's single-tilde strikethrough, which Astro enables by default, otherwise claims `~text~` first.
- *(patch)*
  Backslash-escaped delimiters are now literal in `remd-mark`, `remd-ins`, `remd-del`, `remd-kbd`, `remd-spoiler`, `remd-sub` and `remd-sup`, as they already were in the `mdit-*` plugins: `\==not marked==` renders as `==not marked==` instead of a `<mark>`, while an escaped backslash (`\==marked==`) still allows the markup. These plugins now depend on the new `@mirrordown/core` package, which holds logic shared across Mirrordown's engines.

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
