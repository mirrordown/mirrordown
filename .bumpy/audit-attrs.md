---
"@mirrordown/mdit-attrs": patch
"@mirrordown/remd-attrs": patch
---

markdown-it and remark read attribute blocks by the grammar Sätteri's built-in uses, so the three agree on edge cases: braces that set nothing stay text, single-quoted values work, and a repeated attribute replaces the earlier one in markdown-it instead of doubling it. remark honours `\{` and character references, and an escaped block after another plugin's span. A global or sticky `allowed` pattern no longer alternates between renders, a `rule` subset means the same in both engines, and an unknown rule name is rejected. The guide documents the options, a security note and where Sätteri differs.
