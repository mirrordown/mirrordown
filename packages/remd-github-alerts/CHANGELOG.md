# Changelog






## 0.2.1
<sub>2026-11-17</sub>

- *(patch)*
  Fixes for alert markers and titles the three engines read differently, and for attributes written on an alert.

  - **An attribute block on the line after an alert, written without `>`, goes on the alert** (all engines), with the attrs plugin or Sätteri's `attributes` feature.

    ```markdown
    > [!NOTE]
    > body
    {.foo}
    ```

    Was `<p class="foo">body</p>` inside the alert in markdown-it, the class on the alert but a title with the class `markdown-alert foo-title` in remark, and no class at all in Sätteri. Now `<div class="markdown-alert foo" data-alert="note">` with the title and body untouched, in every engine. In markdown-it this moves a class that used to land on the body's last paragraph; write the block with the alert's `>` (`> {.foo}`) to keep it there.

  - **A class on an alert no longer changes its title's class** (remark).

    ```markdown
    > [!NOTE]
    > body

    {.foo #bar}
    ```

    Was a title with `class="markdown-alert foo-title"`, which the stylesheet does not match. Now `class="markdown-alert-title"`, as in markdown-it.

  - **The title is formatted by the plugins listed after alerts** (remark), here with the mark plugin.

    ```markdown
    > [!NOTE] ==m== t
    > body
    ```

    Was the title text `==m== t`. Now `<mark>m</mark> t`, as in markdown-it and Sätteri.

  - **A title that breaks inside emphasis or a link stays whole** (markdown-it).

    ```markdown
    > [!NOTE] **bold
    > more** text
    ```

    Was malformed HTML, the `<strong>` opened in the title and closed in the body: `<strong>bold</p><p>more</strong> text</p>`. Now the title `<strong>bold\nmore</strong> text`, as in remark and Sätteri.

  - **An escaped marker is a blockquote** (remark, Sätteri).

    ```markdown
    > \[!NOTE]
    > body
    ```

    Was a note alert. Now `<blockquote><p>[!NOTE]\nbody</p></blockquote>`, as in markdown-it. The same goes for `&#91;!NOTE]`, `[\!NOTE]` and `[!NOTE\]`, and `[!NOTE]\+ plus` is an alert titled `+ plus` instead of a foldable one.

  - **Escaped characters and character references in a title reach its `aria-label`** (markdown-it).

    ```markdown
    > [!NOTE] AT\&T rules
    > body
    ```

    Was `aria-label="ATT rules"`. Now `aria-label="AT&amp;T rules"`, as in remark and Sätteri. A title that is only an escaped character (`\*`) was replaced by the default title, and is now `*`.

  - **A heading that starts with a marker is a heading** (markdown-it).

    ```markdown
    > # [!NOTE] Title
    > body
    ```

    Was a note alert titled `Title`. Now `<blockquote><h1>[!NOTE] Title</h1><p>body</p></blockquote>`, as in remark and Sätteri. The same goes for a marker line underlined with `===` or `---`.

  - **A title without plain text is kept** (all engines).

    ```markdown
    > [!NOTE] ![](x.png)
    > body
    ```

    Was the default title `Note`, the image dropped. Now the image as the title, with `aria-label="Note"`.

  - **`> [!constructor]` no longer throws** (all engines).

    ```markdown
    > [!constructor]
    > body
    ```

    Was a `TypeError` that failed the whole document. Now a plain blockquote, like any other unknown keyword.

  - **A key in `types` written with capitals matches** (all engines). With `types: { Spoiler: "spoiler" }`, neither `> [!Spoiler]` nor `> [!spoiler]` was an alert; both are now, and with `matchCaseInsensitive: false` only the first.

  - **An escaped delimiter in an alert's first paragraph no longer stops the inline plugins there** (remark, Sätteri), here with the mark plugin.

    ```markdown
    > [!NOTE] t \==
    > ==a== \==b== c
    ```

    Was the body `==a== ==b== c`. Now `<mark>a</mark> ==b== c`, as in markdown-it.

  - **An attribute block in the title is left out of the title's `aria-label`** (markdown-it, remark), with the attrs plugin.

    ```markdown
    > [!NOTE] *T*{.foo}
    > body
    ```

    Was `aria-label="T{.foo}"`, and in remark the text `{.foo}` after the `<em>`. Now `aria-label="T"` and `<em class="foo">T</em>`, as in Sätteri. In markdown-it `> [!NOTE]{.foo}` rendered an empty title; it now renders the default title with the class on it.

  - **Lone CR line endings are read as line endings** (remark, Sätteri). A title line and a body line separated by a lone carriage return were one title; they are now a title and a body, as in markdown-it.

  - **`remarkGithubAlerts` renders the title even when `githubAlertsHastHandlers` is not passed to `remark-rehype`.** The title was dropped; it now renders, without its icon.

  - **The `titles` option accepts the name of a custom type in its TypeScript type.** `titles: { spoiler: "Spoiler" }` for a type added through `types` worked at runtime but was a type error.

  The guide now lists the cases the engines still read differently when attributes meet an alert.

## 0.2.0
<sub>2026-10-28</sub>

- *(minor)*
  Make `mdit-github-alerts` and `remd-github-alerts` render identical HTML. `remd` no longer drops the first paragraph of an alert when its first line contains formatting or its body starts with formatting (for example `> [!NOTE]` followed by `> **Bold** text`, which lost the whole body). The marker line now works the same in both engines: everything after `[!TYPE]` on the first line is the title, inline formatting included (`> [!NOTE] *Emphasized* title`), with its plain text (including inline code) as the `aria-label`; everything after the first line break, soft or hard, is the body. The icon SVG is no longer wrapped in a redundant `<span aria-hidden>` (`remd`), and a foldable-open alert emits a bare `open` attribute instead of `open=""` (`mdit`).
- *(patch)*
  `mdit-github-alerts` and `remd-github-alerts` now share their alert keywords, default titles, icons, option resolution and (for remark and Sätteri) the marker-line rule through `@mirrordown/core`, instead of keeping duplicate copies. Their output and public exports are unchanged.
- *(patch)*
  Fixes for differences between the markdown-it and remark plugins that only show up when plugins are combined:

  - `mdit-attrs` no longer reads braces in an image's alt text as a trailing attribute block: `![{.cls}](x.png)` gave its paragraph `class="cls"`. Paragraph, heading and list item attributes now only come from literal text, as in `remd-attrs`.
  - `mdit-squeeze-paragraphs` now judges a paragraph empty by what it renders, as `remd-squeeze-paragraphs` does, so a paragraph that was only an attribute block (`{.note}`) is removed instead of kept as an empty `<p class="note">`.
  - `remd-github-alerts` builds its icons as hast elements instead of a `raw` node, so they render in a default unified pipeline instead of appearing as escaped `<svg>` text unless `allowDangerousHtml` was on. Both engines' icons now close their SVG elements explicitly (`<path …></path>`), which is how rehype serializes them by default.
- *(patch)*
  `remd-github-alerts` applies other plugins' `data` to a blockquote that isn't an alert, as remark-rehype's own handler does, so attributes on a blockquote (`> quote` then `{.note}`) are no longer dropped when alerts are on.

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
