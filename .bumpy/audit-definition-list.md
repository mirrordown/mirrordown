---
"@mirrordown/mdit-definition-list": patch
"@mirrordown/remd-definition-list": patch
---

In markdown-it a heading, fence, list item or thematic break after a definition is no longer taken as another term, a marker line wins over a setext underline, and a marker indented four columns is not a marker. In remark a term in a blockquote stays inside its list, tight and loose definitions are told apart in four more cases, and a table's header row is not read as a term. The guide's markdown-it example now imports the name the package exports.
