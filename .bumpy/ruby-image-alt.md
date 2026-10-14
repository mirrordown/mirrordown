---
"@mirrordown/remd-ruby": patch
"markdown-preview-extended-syntax": patch
---

A ruby annotation inside image alt text (`![{word|reading}](image.png)`) now contributes its text to the alt (`alt="wordreading"`), as in `mdit-ruby`; `remd-ruby` produced an empty `alt`.
