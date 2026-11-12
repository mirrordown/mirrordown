---
"@mirrordown/mdit-tab-icons": patch
"@mirrordown/remd-tab-icons": patch
"@mirrordown/sat-tab-icons": patch
---

A marker followed by inline markup no longer repeats the label (`% [!npm] **Install**`). The markdown-it plugin honours `containerClass`, custom keys win ties and match case-insensitively as documented, and an icon whose markup is not an `<svg>` is rejected when the plugin is created. Icons' internal ids are prefixed per icon, and custom SVG with single-quoted or unquoted attributes is read correctly.
