---
"@mirrordown/mdit-ruby": patch
"@mirrordown/remd-ruby": patch
"markdown-denden-furigana": patch
"markdown-preview-extended-syntax": patch
---

A ruby annotation inside image alt text now stays verbatim in the `alt` attribute (`![{word|reading}](image.png)` renders `alt="{word|reading}"`) in both engines. Alt text is an attribute and renders no markup, so the characters reach it exactly as written; `mdit-ruby` produced `alt="wordreading"` and `remd-ruby` an empty `alt`.
