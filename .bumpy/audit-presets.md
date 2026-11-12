---
"@mirrordown/preset-markdown-it": patch
"@mirrordown/preset-remark": patch
"@mirrordown/preset-satteri": patch
---

The remark and Sätteri presets list their plugins in the order markdown-it applies them: ruby first, kbd before del and ins, alerts after the inline plugins and after steps and tabs, and abbr after alerts and attrs. So marks in an alert's title are formatted, the inline plugins apply inside a ruby, and a term inside an attribute block or equal to an alert's keyword no longer gets in the way. tab-icons follows the tabs plugin's `containerClass` in all three.
