---
"@mirrordown/remd-steps": patch
"markdown-preview-extended-syntax": patch
---

Make `remd-steps` render the same HTML as `mdit-steps`. A step header that skips a depth level (`@1. Step one` followed by `@@@1. Too Deep`) or a plain line inside a run of step headers no longer silently disappears with the following content pulled into the previous step: the group ends at that line, which renders as an ordinary paragraph, and a depth-1 header after it starts a new group.
