# Changelog



## 0.1.2
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

## 0.1.1
<sub>2026-10-28</sub>

- *(patch)*
  Fixes for differences between the markdown-it and remark plugins that only show up when plugins are combined:

  - `mdit-attrs` no longer reads braces in an image's alt text as a trailing attribute block: `![{.cls}](x.png)` gave its paragraph `class="cls"`. Paragraph, heading and list item attributes now only come from literal text, as in `remd-attrs`.
  - `mdit-squeeze-paragraphs` now judges a paragraph empty by what it renders, as `remd-squeeze-paragraphs` does, so a paragraph that was only an attribute block (`{.note}`) is removed instead of kept as an empty `<p class="note">`.
  - `remd-github-alerts` builds its icons as hast elements instead of a `raw` node, so they render in a default unified pipeline instead of appearing as escaped `<svg>` text unless `allowDangerousHtml` was on. Both engines' icons now close their SVG elements explicitly (`<path …></path>`), which is how rehype serializes them by default.

## 0.1.0
<sub>2026-07-02</sub>

- *(minor)*
  Add the squeeze-paragraphs plugin set: removes empty (whitespace-only) paragraphs — those with no children or only whitespace text. CommonMark never emits an empty paragraph on its own, so this is a cleanup pass for residue left by other transforms (e.g. a comment stripper, or a plugin that lifts an element out of its wrapping paragraph); place it last in the pipeline to tidy that residue. The markdown-it and remark plugins emit identical HTML. Also bundles the `markdown-squeeze-paragraphs` VSCode preview extension in the extension pack.
