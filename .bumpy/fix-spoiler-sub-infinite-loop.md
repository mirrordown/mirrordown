---
"@mirrordown/mdit-spoiler": patch
"@mirrordown/mdit-sub": patch
"markdown-spoiler": patch
"markdown-preview-extended-syntax": patch
---

Fix an infinite loop / thrown error when `mdit-spoiler` and `mdit-sub` are both active and a document contains an unclosed `~` (e.g. `~15k`). `mdit-spoiler` replaces markdown-it's core `text` rule to make `|` a terminator, but at the inline boundary (`state.pos === state.posMax`) it returned `true` without advancing `state.pos`, violating markdown-it's rule contract — markdown-it 14 throws "inline rule didn't increment state.pos", while the older markdown-it bundled in VSCode's markdown preview caches the non-advancing result and loops forever, wedging the extension host. `mdit-sub`'s scan loop also probed one position too far (`<= max` instead of `< max`; `posMax` is exclusive), which is what reached the boundary. Both are fixed independently: `mdit-spoiler`'s `text` replacement now returns `false` when there is nothing to consume, and `mdit-sub` scans with `< max`. Adds a regression test that renders `about ~15k lines` with both plugins.
