---
"@mirrordown/mdit-spoiler": patch
"@mirrordown/remd-spoiler": patch
"@mirrordown/sat-spoiler": patch
---

The remark plugin no longer shows a spoiler's content in the clear when `spoilerHastHandlers` is not passed to `remark-rehype`: it renders a covered span. In a table cell `\|\|text\|\|` forms a spoiler in remark and Sätteri as it does in markdown-it. Escaped and referenced pipes stay text across plugins, and nesting deeper than 50 spoilers stays text.
