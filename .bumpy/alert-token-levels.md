---
"@mirrordown/mdit-github-alerts": patch
---

The alert's container and title tokens now carry the levels markdown-it's own tokens would, so plugins that walk tokens by level read the alert's structure.
