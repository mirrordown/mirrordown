---
"@mirrordown/core": patch
---

`@mirrordown/core` declares `"sideEffects": false`, so bundlers drop the parts a plugin doesn't import (the escape helpers, the sub/sup micromark syntax) without having to prove them unused.
