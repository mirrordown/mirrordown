---
"markdown-attributes": patch
"markdown-caption": patch
"markdown-file-tree": patch
"markdown-github-alerts": patch
"markdown-mark": patch
"markdown-mermaid-pele": patch
"markdown-prompt": patch
"markdown-steps": patch
"markdown-tab-icons": patch
---

Nine extensions load again. Their last release was built without a package they need inside them, so VS Code could not start them and their syntax showed as plain text in the preview.

- **The extension starts.** The versions published on 2026-11-25 contained `require("@mirrordown/core")`, a package an installed extension does not have, and failed with "Cannot find module '@mirrordown/core'". The package is bundled again, as it was before that release.

  ```markdown
  ==highlighted==
  ```

  Was, with Markdown Mark 0.2.1 installed, `==highlighted==` as text in the preview. Now `<mark>highlighted</mark>`. The same goes for attribute blocks (Markdown Attrs), captions, file trees, alerts and callouts, mermaid diagrams, prompts, steps and tab icons.
