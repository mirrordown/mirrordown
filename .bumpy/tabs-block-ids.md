---
"@mirrordown/core": minor
"@mirrordown/mdit-tabs": minor
"@mirrordown/remd-tabs": minor
"@mirrordown/sat-tabs": minor
"markdown-tabs": minor
---

Tab groups nested in step bodies and other containers work in every engine:

- Block ids (the radio `name` and input ids) number the document's tab groups in the order they open, combined with the group id, instead of hashing a start line that nested groups don't reliably have. Two groups with the same labels in different steps shared radio names, so the first loaded with no panel open and the second's tabs switched the first. Ids of the first group on a page are unchanged; later groups' ids change. Core exports `tabsBlockId`, and `TabsListNode` no longer carries a `blockId`.
- `mdit-tabs` keeps a group together across blank lines inside a container (a step body, tab panel, blockquote or list item) when another entry follows, as `remd-tabs` does: the empty `>` lines between entries are the container's own. At the top level a blank line still ends a group.
