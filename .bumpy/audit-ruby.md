---
"@mirrordown/mdit-ruby": patch
"@mirrordown/remd-ruby": patch
"@mirrordown/sat-ruby": patch
---

In markdown-it a ruby no longer matches across lines or across separate brace groups, so it stops swallowing an attribute block. Sätteri keeps the space between a ruby and its neighbour, keeps inline attributes, and no longer drops the rest of a paragraph after an indented continuation line. Reference links in a base or reading resolve in every engine, spaces and tabs inside the braces are trimmed, and an `rp` that is not a pair of strings is rejected. sat-ruby now depends on `@mirrordown/core`.
