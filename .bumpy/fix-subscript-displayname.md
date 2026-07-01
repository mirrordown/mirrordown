---
"markdown-subscript": patch
---

Revert the Marketplace display name to `Markdown Subscript` (without the `<sub>` tag). The `<sub>` variant is rejected by the VS Code Marketplace as a duplicate name, which failed the `0.1.3` publish; the generated README is regenerated to match.
