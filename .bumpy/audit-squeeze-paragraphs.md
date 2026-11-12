---
"@mirrordown/mdit-squeeze-paragraphs": patch
"@mirrordown/remd-squeeze-paragraphs": patch
"@mirrordown/sat-squeeze-paragraphs": patch
---

markdown-it keeps a paragraph that holds only a non-breaking or other Unicode space, as the other engines do, removes any empty `<p>` rather than only Markdown paragraphs, and with `breaks: true` keeps a paragraph that renders a `<br>`.
