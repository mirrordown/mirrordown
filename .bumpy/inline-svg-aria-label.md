---
"@mirrordown/remd-inline-svg": minor
"markdown-preview-extended-syntax": patch
---

`remd-inline-svg` now gives an inlined `<svg>` its accessible name through `aria-label`, taken from the image's alt text, as `mdit-inline-svg` does. It previously copied `alt` onto the `<svg>`, where it is not a valid attribute, and wrote `alt=""` for images without alt text; an empty alt now adds no attribute.
