---
"@mirrordown/mdit-tabs": patch
"@mirrordown/remd-tabs": patch
"@mirrordown/sat-tabs": patch
"markdown-tabs": patch
---

Clip tabs to their rounded corners with `overflow: clip` rather than `hidden`, so they're no longer a scroll container: sticky content in a panel, such as a file tree's folder rows, now sticks to the page. `display: flow-root` keeps floats in a panel contained, as before.
