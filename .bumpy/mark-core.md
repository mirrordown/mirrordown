---
"@mirrordown/core": minor
"@mirrordown/remd-mark": patch
---

`remd-mark` now runs its `==mark==` scan through `createDelimitedTransform` and `MARK_DELIMITERS` from `@mirrordown/core`, which the Sätteri plugin shares, and drops its `unist-util-find-*` and `unist-builder` dependencies. Its output is unchanged.
