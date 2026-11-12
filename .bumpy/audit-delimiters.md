---
"@mirrordown/mdit-del": patch
"@mirrordown/remd-del": patch
"@mirrordown/sat-del": patch
"@mirrordown/mdit-ins": patch
"@mirrordown/remd-ins": patch
"@mirrordown/sat-ins": patch
"@mirrordown/mdit-mark": patch
"@mirrordown/remd-mark": patch
"@mirrordown/sat-mark": patch
---

An escaped delimiter (`\==`, `\++`, `\--`) stays text even after another plugin has rebuilt the text around it, in remark and Sätteri as in markdown-it. A delimiter written as a character reference (`&#45;-a--`) is no longer read as one, autolink text is left alone, and escapes survive Sätteri's smart punctuation. Under Sätteri an attribute block written right after a span (`--x--{.cls}`) now lands on the span. Nesting deeper than 100 levels stays text in every engine, where Sätteri used to reject the document.
