# Changelog


## 0.1.1
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

## 0.1.0
<sub>2026-06-29</sub>

- *(minor)*
  Add the lightbox plugin set: opt an image into a JavaScript-free, click-to-zoom `<dialog>` lightbox with a leading `!!` (e.g. `!![Alt](photo.jpg)`). The image becomes a `<button>` trigger that opens a modal `<dialog>` — open, close, backdrop dismiss, `Esc`, focus trapping, and the zoom/fade animation are all declarative HTML and CSS (`<dialog>` + Invoker Commands + `closedby` + `@starting-style`), so it works where scripts are disabled, such as the VSCode preview. The dialog `id` is a stable hash of the image `src`, so repeated references to the same image share one dialog; an author `{#id}` (via attrs) overrides it; images inside links are left untouched. The markdown-it and rehype plugins emit identical HTML.
