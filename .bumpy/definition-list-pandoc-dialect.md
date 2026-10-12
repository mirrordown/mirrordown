---
"@mirrordown/mdit-definition-list": minor
"@mirrordown/remd-definition-list": minor
"markdown-definition-list": minor
"markdown-preview-extended-syntax": patch
---

Align definition lists with Pandoc. Looseness is now decided per definition: a `<dd>` wraps its content in `<p>` only when a blank line directly precedes its own marker or separates blocks inside it, instead of one loose definition loosening the whole list (`mdit`) or its whole group (`remd`). A bare marker (`:` or `~` followed by nothing but whitespace) now opens an empty `<dd>` instead of leaving the line as paragraph text. Both behaviors match Pandoc, `remark-definition-list`, `@mdit/plugin-dl`, and Sätteri. `remd-definition-list` also fixes three parsing bugs that previously had their own remark-only test expectations: a definition list inside a list item is now recognized, and a `:` line that does not continue the blockquote or list item holding the term is now a lazy paragraph continuation rather than a new definition. Both plugins now share a single set of expected outputs.
