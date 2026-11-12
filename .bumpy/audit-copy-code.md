---
"@mirrordown/mdit-copy-code": patch
"@mirrordown/remd-copy-code": patch
"@mirrordown/sat-copy-code": patch
---

markdown-it writes option text holding `$&` or `$$` as it is, and adds buttons when tokens are rendered with a different `env` than they were parsed with. The client script does nothing when loaded a second time, and a button copies its own block when another element on the page shares the block's id.
