---
"@mirrordown/mdit-autolink-headings": patch
"@mirrordown/remd-autolink-headings": patch
"@mirrordown/sat-autolink-headings": patch
---

markdown-it escapes the heading's id and the `class` option in the link it writes. An unknown `behavior` is rejected in every engine, where each used to do something different, and `null` means the default. In Sätteri the link points at an id set through `headingProperties`.
