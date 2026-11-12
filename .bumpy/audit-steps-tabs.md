---
"@mirrordown/mdit-steps": patch
"@mirrordown/remd-steps": patch
"@mirrordown/sat-steps": patch
"@mirrordown/mdit-tabs": patch
"@mirrordown/remd-tabs": patch
"@mirrordown/sat-tabs": patch
---

The three engines agree on edge-case input they used to read differently: CRLF line endings, a trailing hard break on a header line, a line without the body's `>`, a blank line inside a body, headers and bodies in list items, a `>` indented four columns, and an escaped marker. markdown-it's rules respect the container they are in. Tab block ids are assigned in document order, so they match across engines, and `md.parse` without an env no longer throws. Output for documented input is unchanged.
