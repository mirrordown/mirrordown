---
"@mirrordown/core": minor
"@mirrordown/mdit-github-alerts": patch
"@mirrordown/remd-github-alerts": patch
"markdown-github-alerts": patch
---

`mdit-github-alerts` and `remd-github-alerts` now share their alert keywords, default titles, icons, option resolution and (for remark and Sätteri) the marker-line rule through `@mirrordown/core`, instead of keeping duplicate copies. Their output and public exports are unchanged.
