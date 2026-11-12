---
"@mirrordown/mdit-abbr": patch
"@mirrordown/remd-abbr": patch
"@mirrordown/sat-abbr": patch
---

A definition such as `*[_proto__]: x` no longer hangs markdown-it. remark and Sätteri find a term between the same boundaries markdown-it uses, so `C++` matches and a term directly beside a CJK letter no longer does; they read a definition from its source, so a title keeps what was written and a term holding inline syntax is recognised; and definitions on CRLF lines are read. Blank terms and titles are rejected, and an escaped delimiter after an abbreviation stays text.
