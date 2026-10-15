---
"@mirrordown/remd-definition-list": patch
---

A definition list term fits on one line, as in Pandoc and `mdit-definition-list`: a `:` marker after a paragraph of two or more lines continues that paragraph instead of starting a list. `remd-definition-list` made every line a term at the top level (one term per line, all sharing the definition) and only the last line a term inside a blockquote. With GFM tables on, the marker line no longer splits the paragraph either.
