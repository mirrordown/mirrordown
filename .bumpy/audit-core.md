---
"@mirrordown/core": minor
---

Add `textEscapes` and `carryEscapes`, which let a plugin that splits a text node pass on which of its characters were escaped, and `createAttributeReader` with the span-attribute helpers the Sätteri plugins use to place an attribute block on a span. Escaped characters and character references now stay literal through every span plugin instead of only the first to run, line-based recognition reads CRLF and lone CR line endings, and tables keyed by user text no longer match members every object inherits.
