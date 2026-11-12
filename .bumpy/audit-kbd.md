---
"@mirrordown/mdit-kbd": patch
"@mirrordown/remd-kbd": patch
"@mirrordown/sat-kbd": patch
---

`[[key]]` is a key in every engine even beside link syntax or where a matching `[key]:` definition exists; remark and Sätteri used to read a link. In markdown-it a code span, autolink or HTML tag inside a key is one unit, so a `]]` in inline code no longer closes the key, and a hard break ends it. Scanning is linear: a long run of `[[` took seconds. Nesting deeper than 100 keys stays text, and under Sätteri an attribute block after a key lands on the key.
