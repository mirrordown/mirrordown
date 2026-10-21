---
"@mirrordown/core": minor
"@mirrordown/mdit-inline-svg": patch
"@mirrordown/remd-inline-svg": patch
"@mirrordown/sat-inline-svg": minor
"@mirrordown/preset-satteri": patch
---

New `@mirrordown/sat-inline-svg`: inlines referenced local `.svg` images as `<svg>` elements in Sätteri, resolving them against the `fileURL` compile option, with the same output as `mdit-inline-svg` and `remd-inline-svg`. The size limits, deduplication and markup move into `@mirrordown/core` (`inlineSvgMarkup`, `svgSpriteId`), which the markdown-it and rehype plugins now use too; their output is unchanged. Like the other presets, `@mirrordown/preset-satteri` leaves it out because it reads files from disk.
