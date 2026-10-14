---
"@mirrordown/mdit-attrs": minor
"@mirrordown/remd-attrs": minor
"markdown-attributes": minor
"markdown-preview-extended-syntax": patch
---

Make `mdit-attrs` and `remd-attrs` render identical HTML, following markdown-it-attrs wherever the two disagreed. An attribute line lazily continuing a list's last item (`- a`, `- b`, `{.list}`) now applies to that list, including nested lists, in both engines; it was silently dropped. An attribute block on the line after a hard break now applies to the paragraph and keeps the `<br>` (`mdit-attrs` dropped the class, `remd-attrs` dropped the break). Text consisting only of an attribute block is no longer ignored by either engine's delimiter check. `remd-attrs` now supports attributes after a fence's language (` ```js {.x} `), on table cells (`td` and `th`), and at the end of loose and ordered list items. On fences, `class` is now always the first attribute in both engines (`mdit-attrs` wrote `id` before the language class).
