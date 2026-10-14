---
"@mirrordown/mdit-definition-list": patch
"markdown-definition-list": patch
"markdown-preview-extended-syntax": patch
---

`mdit-definition-list` now requires continuation lines to reach a definition's content column, as `remd-definition-list` does: one column past the marker plus the spaces after it (`:   Red.` needs four spaces), or a single space when the marker ends the line or is followed by more than four spaces, in which case the rest is an indented code block. It previously accepted any continuation indented two columns past the marker.
