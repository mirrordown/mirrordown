---
"@mirrordown/remd-tabs": patch
"@mirrordown/sat-tabs": patch
"@mirrordown/remd-steps": patch
"@mirrordown/sat-steps": patch
"@mirrordown/core": patch
---

Tab and step headers are placed by their `>` markers in remark and Sätteri, as markdown-it reads them. A header right after a paragraph, at its level, interrupts it and starts a group. A header written with a panel's or step body's own `>` is that panel's content: `% Tab` or `@1. Step` there starts a group inside it, and a nested header (`%%`, `@@`) with nothing to nest in stays text. Before, both became the next tab or step of the outer group.
