---
"@mirrordown/remd-tabs": patch
"@mirrordown/sat-tabs": patch
"@mirrordown/remd-steps": patch
"@mirrordown/sat-steps": patch
"@mirrordown/core": patch
---

A line written without a tab panel's or step body's `>` right after the last panel now starts a paragraph after the group in remark and Sätteri, as markdown-it reads it, instead of continuing the panel's last paragraph (CommonMark's lazy continuation). The lines after it, and attributes ending them, go with it.
