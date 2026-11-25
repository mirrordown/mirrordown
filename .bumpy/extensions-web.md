---
"markdown-preview-extended-syntax": patch
"markdown-abbr": patch
"markdown-attributes": patch
"markdown-autolink-headings": patch
"markdown-caption": patch
"markdown-definition-list": patch
"markdown-del": patch
"markdown-denden-furigana": patch
"markdown-file-tree": patch
"markdown-github-alerts": patch
"markdown-inline-svg": patch
"markdown-ins": patch
"markdown-keyboard": patch
"markdown-lightbox": patch
"markdown-mark": patch
"markdown-mermaid-pele": patch
"markdown-prompt": patch
"markdown-sectionize": patch
"markdown-spoiler": patch
"markdown-squeeze-paragraphs": patch
"markdown-steps": patch
"markdown-subscript": patch
"markdown-superscript": patch
"markdown-tab-icons": patch
"markdown-tabs": patch
"markdown-unwrap-images": patch
---

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
