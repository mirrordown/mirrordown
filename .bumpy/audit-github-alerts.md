---
"@mirrordown/mdit-github-alerts": patch
"@mirrordown/remd-github-alerts": patch
"@mirrordown/sat-github-alerts": patch
---

`> [!constructor]` and other keywords naming members every object inherits no longer throw. markdown-it no longer emits malformed HTML when a title breaks inside emphasis or a link, and no longer turns a heading that starts with a marker into an alert. An escaped marker (`\[!NOTE]`) is a blockquote in every engine. In remark the title is part of the tree, so later plugins format it and it is kept without the hast handlers. A class written on its own line after an alert goes on the alert.
