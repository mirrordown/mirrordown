# Changelog



## 0.1.2
<sub>2026-11-25</sub>

- *(patch)*
  Nine extensions load again. Their last release was built without a package they need inside them, so VS Code could not start them and their syntax showed as plain text in the preview.

  - **The extension starts.** The versions published on 2026-11-25 contained `require("@mirrordown/core")`, a package an installed extension does not have, and failed with "Cannot find module '@mirrordown/core'". The package is bundled again, as it was before that release.

    ```markdown
    ==highlighted==
    ```

    Was, with Markdown Mark 0.2.1 installed, `==highlighted==` as text in the preview. Now `<mark>highlighted</mark>`. The same goes for attribute blocks (Markdown Attrs), captions, file trees, alerts and callouts, mermaid diagrams, prompts, steps and tab icons.

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
<sub>2026-11-03</sub>

- *(minor)*
  Add the file-tree plugin set, a port of Vocs' File Tree that degrades gracefully: a ` ```filetree ` fence renders as a file tree laid out like VS Code's explorer, and stays a readable code block where the plugin isn't installed, such as on GitHub. Rows nest by indentation, or by the branches the `tree` command draws (Unicode or `--charset=ascii`), or by list markers. `name/` marks a folder and `name/…` one that starts closed; `#` or `//` starts a comment, `**name**` highlights a row, and `[A]` `[M]` `[D]` `[R]` `[U]` `[I]` mark git status. Files get Seti UI's icons and colors as inline SVG, which the `icons` option adds to or replaces. The `theme` option takes a Shiki or VS Code theme, or a light and dark pair, so trees match the code blocks around them; each color can also be set with a `--markdown-file-tree-*` custom property, and a color left out or given an invalid value falls back on its own. Each folder is a `<details>`, so trees open and close without JavaScript, and folder rows stick to the page as their contents scroll past; the optional client script makes each tree an ARIA tree, navigated with the arrow keys. The Markdown File Tree VS Code extension renders trees in the preview in the editor's theme. The markdown-it, remark and Sätteri plugins emit identical HTML.
