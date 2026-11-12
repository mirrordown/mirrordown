---
"@mirrordown/mdit-caption": patch
"@mirrordown/remd-caption": patch
"@mirrordown/sat-caption": patch
---

markdown-it no longer emits unbalanced HTML when a caption line follows a break inside emphasis or a link, keeps an author's `text-align` on a caption, and nests a captioned `prompt` block correctly. In remark and Sätteri a caption in a task-list item, or an item starting with a blank line, captions the right block. CRLF input and captions after multi-line inline content are read correctly.
