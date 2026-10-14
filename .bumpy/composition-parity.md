---
"@mirrordown/mdit-attrs": patch
"@mirrordown/mdit-squeeze-paragraphs": patch
"@mirrordown/mdit-github-alerts": patch
"@mirrordown/remd-github-alerts": patch
"markdown-attrs": patch
"markdown-squeeze-paragraphs": patch
"markdown-github-alerts": patch
---

Fixes for differences between the markdown-it and remark plugins that only show up when plugins are combined:

- `mdit-attrs` no longer reads braces in an image's alt text as a trailing attribute block: `![{.cls}](x.png)` gave its paragraph `class="cls"`. Paragraph, heading and list item attributes now only come from literal text, as in `remd-attrs`.
- `mdit-squeeze-paragraphs` now judges a paragraph empty by what it renders, as `remd-squeeze-paragraphs` does, so a paragraph that was only an attribute block (`{.note}`) is removed instead of kept as an empty `<p class="note">`.
- `remd-github-alerts` builds its icons as hast elements instead of a `raw` node, so they render in a default unified pipeline instead of appearing as escaped `<svg>` text unless `allowDangerousHtml` was on. Both engines' icons now close their SVG elements explicitly (`<path …></path>`), which is how rehype serializes them by default.
