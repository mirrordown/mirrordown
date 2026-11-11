---
"@mirrordown/sat-abbr": minor
"@mirrordown/sat-autolink-headings": minor
"@mirrordown/sat-caption": minor
"@mirrordown/sat-copy-code": minor
"@mirrordown/sat-del": minor
"@mirrordown/sat-file-tree": minor
"@mirrordown/sat-github-alerts": minor
"@mirrordown/sat-inline-svg": minor
"@mirrordown/sat-ins": minor
"@mirrordown/sat-kbd": minor
"@mirrordown/sat-lightbox": minor
"@mirrordown/sat-mark": minor
"@mirrordown/sat-mermaid-pele": minor
"@mirrordown/sat-prompt": minor
"@mirrordown/sat-ruby": minor
"@mirrordown/sat-sectionize": minor
"@mirrordown/sat-slug": minor
"@mirrordown/sat-spoiler": minor
"@mirrordown/sat-squeeze-paragraphs": minor
"@mirrordown/sat-steps": minor
"@mirrordown/sat-tab-icons": minor
"@mirrordown/sat-tabs": minor
"@mirrordown/sat-unwrap-images": minor
"@mirrordown/preset-satteri": minor
---

Require Sätteri 0.11.3 or later, which Astro ships from 7.4.7 (`@astrojs/markdown-satteri` 0.4.7). The plugins now read the document's features from Sätteri itself, so in Astro `satteriRuby()` needs no `features` passed to it, and tabs and steps no longer allow for a Sätteri that passes none. On Astro 7.4.6 or earlier, update Astro first.
