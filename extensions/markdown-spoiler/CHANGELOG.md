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
<sub>2026-07-02</sub>

- *(patch)*
  Fix an infinite loop / thrown error when `mdit-spoiler` and `mdit-sub` are both active and a document contains an unclosed `~` (e.g. `~15k`). `mdit-spoiler` replaces markdown-it's core `text` rule to make `|` a terminator, but at the inline boundary (`state.pos === state.posMax`) it returned `true` without advancing `state.pos`, violating markdown-it's rule contract — markdown-it 14 throws "inline rule didn't increment state.pos", while the older markdown-it bundled in VSCode's markdown preview caches the non-advancing result and loops forever, wedging the extension host. `mdit-sub`'s scan loop also probed one position too far (`<= max` instead of `< max`; `posMax` is exclusive), which is what reached the boundary. Both are fixed independently: `mdit-spoiler`'s `text` replacement now returns `false` when there is nothing to consume, and `mdit-sub` scans with `< max`. Adds a regression test that renders `about ~15k lines` with both plugins.

## 0.1.0
<sub>2026-07-01</sub>

- *(minor)*
  Add the spoiler plugin set: Discord-style `||spoiler||` click-to-reveal for inline content and images. Inline text becomes an obscured bar (per-line via `box-decoration-break`); wrap an image (`||![](…)||`) and it renders heavily blurred with a centered **SPOILER** pill, revealing the sharp image on click — Discord's image-spoiler treatment. The whole interaction is a `<label>` wrapping a visually-hidden checkbox and the content, revealed with the `:checked` sibling selector, so **no JavaScript runs** and it works in the VSCode preview. Keyboard-operable (Space) and announced as a spoiler control by screen readers. Combines with `lightbox` (`||!![](…)||`) for a spoilered image that is also click-to-zoom once revealed. The markdown-it and remark plugins emit identical HTML. Also bundles the `markdown-spoiler` VSCode preview extension in the extension pack.
