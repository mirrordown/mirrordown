---
"@mirrordown/core": patch
---

Give the sub/sup syntax's marker type an explicit definition, so JSR no longer reports a slow type in the public API, and type paragraph attributes so core type-checks on its own, without mdast-util-to-hast's type augmentation loaded.
