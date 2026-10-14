---
"@mirrordown/core": minor
"@mirrordown/remd-del": patch
"@mirrordown/remd-ins": patch
"@mirrordown/remd-kbd": patch
"@mirrordown/remd-mark": patch
"@mirrordown/remd-spoiler": patch
"@mirrordown/remd-sub": patch
"@mirrordown/remd-sup": patch
"markdown-preview-extended-syntax": patch
---

Backslash-escaped delimiters are now literal in `remd-mark`, `remd-ins`, `remd-del`, `remd-kbd`, `remd-spoiler`, `remd-sub` and `remd-sup`, as they already were in the `mdit-*` plugins: `\==not marked==` renders as `==not marked==` instead of a `<mark>`, while an escaped backslash (`\==marked==`) still allows the markup. These plugins now depend on the new `@mirrordown/core` package, which holds logic shared across Mirrordown's engines.
