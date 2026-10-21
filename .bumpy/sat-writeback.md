---
"@mirrordown/core": minor
"@mirrordown/sat-steps": patch
---

`@mirrordown/sat-steps` writes back only the parts of the tree that step recognition changed, through core's new `editableTree`, so every node it leaves alone stays Sätteri's own and keeps its source position for the plugins after it (tabs reads positions to end a group at a blank line). It also recognizes a step header directly after a list marker (`- @1. Step`), as the remark and markdown-it plugins do.
