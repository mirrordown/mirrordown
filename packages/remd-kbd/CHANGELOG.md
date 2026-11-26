# Changelog








## 0.1.7
<sub>2026-11-26</sub>

- *(patch)* Updated dependency `@mirrordown/core` v0.4.0

## 0.1.6
<sub>2026-11-24</sub>

- *(patch)* Updated dependency `@mirrordown/core` v0.3.0

## 0.1.5
<sub>2026-11-17</sub>

- *(patch)*
  Fixes for edge cases where the three engines read `[[key]]` differently. Two of them change what existing documents render: in remark and Sätteri a key now wins over a link that shares its brackets, and in markdown-it a key now treats inline code, links and line breaks inside it as the other engines do.

  - **A key whose name is also a link reference is a key** (remark, Sätteri).

    ```markdown
    [[a]]

    [a]: /u
    ```

    Was `[<a href="/u">a</a>]`. Now `<kbd>a</kbd>`, as in markdown-it.

  - **A key followed by parentheses or a reference is a key, not a link** (remark, Sätteri).

    ```markdown
    [[a]](url)
    ```

    Was `<a href="url">[a]</a>`. Now `<kbd>a</kbd>(url)`, as in markdown-it. Likewise `[[a]][ref]` is a key followed by the link `ref`, and `![[a]]` is `!` and a key.

  - **An attribute block written right after a key goes on the `<kbd>`** (Sätteri, with its `attributes` feature on).

    ```markdown
    x [[Ctrl]]{.key} y
    ```

    Was `x <kbd>Ctrl</kbd>{.key} y`, and at the end of a paragraph the class went on the `<p>`. Now `x <kbd class="key">Ctrl</kbd> y`, as in markdown-it and remark.

  - **Closing brackets inside inline code, an autolink or an HTML tag do not close the key** (markdown-it).

    ```markdown
    [[a `]]` b]]
    ```

    Was ``<kbd>a <code>]]</code></kbd>` b]]``. Now `<kbd>a <code>]]</code> b</kbd>`, as in remark and Sätteri.

  - **A link inside a key is part of the key** (markdown-it).

    ```markdown
    [[x [a]]]

    [a]: /u
    ```

    Was `<kbd>x [a</kbd>]`. Now `<kbd>x <a href="/u">a</a></kbd>`, as in remark and Sätteri.

  - **A backslash line break ends the key attempt** (markdown-it).

    ```markdown
    [[a\
    b]]
    ```

    Was `<kbd>a<br>b</kbd>`. Now the text `[[a<br>b]]`, as in remark and Sätteri. A code span that runs over a line ending inside a key no longer stops the key either.

  - **An escaped key stays text after another plugin's span** (remark, Sätteri).

    ```markdown
    --a-- \[[x]]
    ```

    Was `<del>a</del> <kbd>x</kbd>`. Now `<del>a</del> [[x]]`, as in markdown-it.

  - **An escape is still honoured after smart punctuation** (Sätteri, with smart punctuation on).

    ```markdown
    "q" \[[x]] [[y]]
    ```

    Was `“q” <kbd>x</kbd> <kbd>y</kbd>`. Now `“q” [[x]] <kbd>y</kbd>`. The same went wrong in remark and Sätteri after a character reference that decodes to two characters, such as an emoji.

  - **A bracket written as a character reference is not a bracket** (remark, Sätteri).

    ```markdown
    &#91;[x]]
    ```

    Was `<kbd>x</kbd>`. Now the text `[[x]]`.

  - **Keys nest up to 100 deep** (remark, Sätteri). Deeper brackets stay text, as in markdown-it. remark used to overflow the stack on a few thousand levels and Sätteri rejected the whole document past 128.

  - **A line of unclosed `[[` is scanned in linear time** (all engines). 40 KB of them took about seven seconds.

  - **A lone carriage return is a line ending, so no key forms across it** (remark, Sätteri).

  - **Private Use characters you typed are kept** (remark, Sätteri). Characters in the range U+F0021 to U+F007E, where some icon fonts put their glyphs, were rewritten to ASCII punctuation, so two of them could even turn into brackets.

  The guide now says that a key wins over a link, and lists the differences between engines that remain.

## 0.1.4
<sub>2026-10-28</sub>

- *(patch)*
  Backslash-escaped delimiters are now literal in `remd-mark`, `remd-ins`, `remd-del`, `remd-kbd`, `remd-spoiler`, `remd-sub` and `remd-sup`, as they already were in the `mdit-*` plugins: `\==not marked==` renders as `==not marked==` instead of a `<mark>`, while an escaped backslash (`\==marked==`) still allows the markup. These plugins now depend on the new `@mirrordown/core` package, which holds logic shared across Mirrordown's engines.
- *(patch)*
  `[[key]]` now scans the same way in every engine. `@mirrordown/core`'s new `createKbdTransform` ports markdown-it-kbd's tokenizer, and `remd-kbd` and the new `@mirrordown/sat-kbd` run on it:

  - Keys nest: `[[a [[b]] c]]`.
  - A single `]` stays inside a key: `[[a]b]]`.
  - A line ending before the closing `]]` cancels the key even when formatting sits in between.
  - `[[[a]]` keeps the extra `[` outside the key.

  `remd-kbd` drops its `unist-util-find-*` and `unist-builder` dependencies. One difference is inherent to the engines and documented in the guide: markdown-it reads `[[*a]]*` as a key, while remark and Sätteri have already read the emphasis.

  `@mirrordown/sat-kbd` is included in `@mirrordown/preset-satteri`.

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
