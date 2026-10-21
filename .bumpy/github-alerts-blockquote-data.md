---
"@mirrordown/remd-github-alerts": patch
"@mirrordown/preset-remark": patch
---

`remd-github-alerts` applies other plugins' `data` to a blockquote that isn't an alert, as remark-rehype's own handler does, so attributes on a blockquote (`> quote` then `{.note}`) are no longer dropped when alerts are on.
