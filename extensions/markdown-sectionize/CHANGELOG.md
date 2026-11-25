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
  Fixes for steps that show up with nesting or other plugins:

  - The steps stylesheet lays out nested steps correctly. Its nested-list rule targeted `.markdown-steps` instead of the `.markdown-steps-list` class nested lists carry, so a nested list fell into the number column and overlapped the step body.
  - `remd-steps` keeps a step's title in the tree, so remark plugins that run after it, such as `remd-spoiler` in `@mirrordown/preset-remark`, also apply to the title: `@1. A ||secret||` rendered its spoiler in markdown-it but not in remark.
  - `mdit-sectionize` only wraps top-level headings in sections, as `remd-sectionize` does, and `mdit-steps` nests its body tokens inside the step: a heading in a step body, blockquote or list item opened a `<section>` that closed outside its container, which is invalid HTML.

## 0.1.0
<sub>2026-07-02</sub>

- *(minor)*
  Add the sectionize plugin set: wraps each heading and the content beneath it — up to the next heading of equal or shallower depth — in a semantic `<section data-depth="N">` element, nesting deeper headings inside their ancestors' sections to mirror the document outline. Skipped heading levels nest gracefully (an `<h3>` under an `<h1>` becomes `data-depth="3"` with no invented `<h2>` section) and content before the first heading stays unwrapped. It only wraps and never touches heading ids, so it composes with `slug`/`autolink-headings` when run first. The markdown-it and remark plugins emit identical HTML. Also bundles the `markdown-sectionize` VSCode preview extension in the extension pack.
