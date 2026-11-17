# Changelog






## 0.1.5
<sub>2026-11-17</sub>

- *(patch)*
  Fixes for edge cases where the three engines read `{base|reading}` differently. Most are in markdown-it, which matched too much, and in Sätteri, which lost text and attributes around a ruby.

  - **A ruby stays on one line and inside one pair of braces** (markdown-it).

    ```markdown
    Use {name} as a placeholder.
    Then a | b or {x}.
    ```

    Was one ruby from `{name` to `x}`, with `name} as a placeholder. Then a` as its base. Now the text as written, as in remark and Sätteri.

  - **An attribute block before a ruby is no longer swallowed by it** (markdown-it, with the attrs plugin).

    ```markdown
    *a*{.x} and {漢字|かんじ} here
    ```

    Was `<em>a</em><ruby>.x} and {漢字<rt>かんじ</rt></ruby> here`. Now `<em class="x">a</em> and <ruby>漢字<rt>かんじ</rt></ruby> here`, as in remark.

  - **The space between a ruby and the element beside it is kept** (Sätteri).

    ```markdown
    *x* {a|b}
    ```

    Was `<em>x</em><ruby>a<rt>b</rt></ruby>`. Now `<em>x</em> <ruby>a<rt>b</rt></ruby>`.

  - **An attribute block written right after a ruby goes on the `<ruby>`** (Sätteri, with its `attributes` feature on).

    ```markdown
    {漢字|かんじ}{.x}
    ```

    Was `<p class="x"><ruby>…</ruby></p>`, and mid-paragraph the block stayed on the page as text. Now `<p><ruby class="x">…</ruby></p>`, as in markdown-it and remark.

  - **Attributes on an element that holds or follows a ruby are kept** (Sätteri, with its `attributes` feature on).

    ```markdown
    *{漢字|かんじ}*{.x}
    ```

    Was `<em><ruby>…</ruby></em>`, the class lost. Now `<em class="x"><ruby>…</ruby></em>`. A block with no element to go on, as in `{a|b} word{.r} *em*`, used to vanish from the page and now stays as text, as in the other engines.

  - **Spaces and tabs around the base and the reading are dropped** (all engines).

    ```markdown
    { a | b }
    ```

    Was `<ruby> a <rt> b </rt></ruby>` in markdown-it. Now `<ruby>a<rt>b</rt></ruby>`, as in remark and Sätteri. A base indented four or more spaces, `{    a|b}`, kept its spaces in every engine and no longer does.

  - **Emphasis markers directly against a ruby inside a word stay text** (Sätteri). This changes documents that relied on it.

    ```markdown
    これは**{漢字|かんじ}**です
    ```

    Was `これは<strong><ruby>…</ruby></strong>です`. Now `これは**<ruby>…</ruby>**です`, as in markdown-it and remark, where a brace is punctuation to the asterisks beside it.

  - **A reference link in a base or a reading resolves** (remark, Sätteri).

    ```markdown
    {[foo]|bar}

    [foo]: /url
    ```

    Was `<ruby>[foo]<rt>bar</rt></ruby>`. Now `<ruby><a href="/url">foo</a><rt>bar</rt></ruby>`, as in markdown-it. Image and footnote references resolve too.

  - **An escaped delimiter after a ruby stays text** (Sätteri, with a span plugin such as mark).

    ```markdown
    {漢字|かんじ} \==b==
    ```

    Was `<ruby>…</ruby> <mark>b</mark>`. Now `<ruby>…</ruby> ==b==`.

  - **An indented continuation line that starts like a block keeps its text** (Sätteri).

    ```markdown
    a
        - b {x|y}
    ```

    Was `<p>a</p>`: the rest of the paragraph, ruby included, was dropped. Now `a` and `- b <ruby>x<rt>y</rt></ruby>` in one paragraph. A line starting with `>` used to lose the `>`.

  - **A backslash before the bar is removed only in a table cell** (remark, Sätteri).

    ```markdown
    {a\|b}
    ```

    Was `<ruby>a<rt>b</rt></ruby>`. Now `<ruby>a\<rt>b</rt></ruby>`, as in markdown-it. In a table cell, where the bar has to be escaped, the backslash is still removed.

  - **A ruby holding a `]` works inside a link's text** (markdown-it).

    ```markdown
    [{a|b]c}](/url)
    ```

    Was no link: `[<ruby>a<rt>b]c</rt></ruby>](/url)`. Now `<a href="/url"><ruby>a<rt>b]c</rt></ruby></a>`, as in remark and Sätteri.

  - **A base or a reading that opens with an HTML tag is inline HTML** (remark, Sätteri, with raw HTML allowed).

    ```markdown
    {<b>|x}
    ```

    Was the tag escaped and shown as text. Now `<ruby><b><rt>x</rt></ruby>`, as in markdown-it.

  - **An `rp` that is not a pair of strings is refused** (all engines). `rp: ["("]` used to print `<rp>undefined</rp>` in markdown-it and remark and no `<rp>` at all in Sätteri; it now throws a `TypeError`.

  - **Running the remark transformer twice on one tree no longer throws** (remark).

  - **Private Use characters you typed are never taken for the plugin's own placeholders** (Sätteri). Such a character before a digit could be replaced by a copy of a ruby, or deleted.

  `@mirrordown/sat-ruby` now depends on `@mirrordown/core`. The guide now says where Sätteri still differs.

## 0.1.4
<sub>2026-10-28</sub>

- *(patch)*
  A ruby annotation inside image alt text now stays verbatim in the `alt` attribute (`![{word|reading}](image.png)` renders `alt="{word|reading}"`) in both engines. Alt text is an attribute and renders no markup, so the characters reach it exactly as written; `mdit-ruby` produced `alt="wordreading"` and `remd-ruby` an empty `alt`.

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
