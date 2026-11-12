---
"@mirrordown/mdit-slug": patch
"@mirrordown/remd-slug": patch
"@mirrordown/sat-slug": patch
---

A generated id never repeats one written by hand: `## B {#b}` and a later `## B` get `b` and `b-1`. markdown-it treats an empty id as none, and builds the slug from all of a heading's text.
