# Changelog






## 0.2.2
<sub>2026-11-25</sub>

- *(patch)*
  The extensions work in a workspace VS Code has not been told to trust, the pack installs cleanly in VS Code for the Web, and Inline SVG's preview script loads again.

  - **Every extension works in Restricted Mode.** VS Code switches off an extension that does not say it supports untrusted workspaces, and opens a GitHub repository on vscode.dev or github.dev in Restricted Mode. There, none of these extensions took part in the Markdown preview: tabs, highlights and the rest showed as their source text until the workspace was trusted. Each extension now declares `capabilities.untrustedWorkspaces.supported`. They only turn Markdown into HTML for the preview; none runs code from the workspace or reads its settings.

    ```markdown
    % Demo
    > ==highlighted==
    % Code
    > text
    ```

    Was, in Restricted Mode, the paragraph `% Demo` followed by a quote. Now a tab group with a highlight in its first panel, as in a trusted workspace.

  - **The pack no longer includes `Billaferd.vscode-header-sections`.** It is not a web extension, so installing the pack in VS Code for the Web stopped with "contains extensions which are not supported in Visual Studio Code for the Web". The pack's own Markdown Sectionize wraps a heading and its content in a `<section>`, which is what that extension was there for.

  - **Inline SVG's preview script is found.** The extension told the preview to load `dist/preview.js` and shipped `dist/preview.mjs`, so the request failed with a 404, in the desktop app and on the web, and the script that swaps an SVG image for its own markup never ran. It is now built as `dist/preview.iife.js`, a plain script the preview can run, and the manifest names that file.

## 0.2.1
<sub>2026-10-28</sub>

- *(patch)*
  `mdit-definition-list` now requires continuation lines to reach a definition's content column, as `remd-definition-list` does: one column past the marker plus the spaces after it (`:   Red.` needs four spaces), or a single space when the marker ends the line or is followed by more than four spaces, in which case the rest is an indented code block. It previously accepted any continuation indented two columns past the marker.

## 0.2.0
<sub>2026-10-14</sub>

- *(minor)*
  Align definition lists with Pandoc. Looseness is now decided per definition: a `<dd>` wraps its content in `<p>` only when a blank line directly precedes its own marker or separates blocks inside it, instead of one loose definition loosening the whole list (`mdit`) or its whole group (`remd`). A bare marker (`:` or `~` followed by nothing but whitespace) now opens an empty `<dd>` instead of leaving the line as paragraph text. Both behaviors match Pandoc, `remark-definition-list`, `@mdit/plugin-dl`, and Sätteri. `remd-definition-list` also fixes three parsing bugs that previously had their own remark-only test expectations: a definition list inside a list item is now recognized, and a `:` line that does not continue the blockquote or list item holding the term is now a lazy paragraph continuation rather than a new definition. Both plugins now share a single set of expected outputs.

## 0.1.2
<sub>2026-06-27</sub>

- *(patch)*
  Fix broken syntax rendering: the published 0.1.1 vsix files externalized the
  bundled markdown-it plugin (a bare `require("@mirrordown/mdit-*")` that isn't in
  the vsix), so no extension actually loaded its plugin. Force-bundle the plugin
  via `pack.deps.alwaysBundle`, and build the plugin packages before the
  extensions in CI so there is a dist to bundle.

## 0.1.1
<sub>2026-06-27</sub>

- *(patch)*
  Initial VSCode Marketplace release for the remaining syntax extensions and the
  extension pack, now that the vsce publish pipeline is proven (markdown-mark@0.1.1
  shipped cleanly).

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
