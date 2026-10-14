---
"@mirrordown/mdit-inline-svg": minor
"@mirrordown/remd-inline-svg": minor
"markdown-inline-svg": minor
"markdown-preview-extended-syntax": patch
---

`remd-inline-svg` now inserts the SVG file's markup verbatim as a `raw` node instead of parsing it into hast elements, so its output is byte-for-byte the same as `mdit-inline-svg` (previously hast re-serialized the SVG, rewriting values such as `fill-opacity=".5"` to `"0.5"` and `<path/>` to `<path></path>`). **Breaking:** `rehype-stringify` now needs `allowDangerousHtml: true`, and later rehype plugins see the inlined SVG as an opaque string rather than an element tree. With `deduplication`, the hidden sprite is now emitted right before the first `<use>` reference, as in `mdit-inline-svg`, instead of at the start of the document.

Both packages: with `deduplication`, sprite ids are now derived from the SVG's path relative to the document instead of its absolute path, so the same document produces the same ids on every machine and OS.
