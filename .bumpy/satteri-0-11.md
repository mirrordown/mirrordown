---
"@mirrordown/preset-satteri": minor
"@mirrordown/sat-abbr": patch
"@mirrordown/sat-autolink-headings": patch
"@mirrordown/sat-del": patch
"@mirrordown/sat-github-alerts": patch
"@mirrordown/sat-inline-svg": patch
"@mirrordown/sat-ins": patch
"@mirrordown/sat-kbd": patch
"@mirrordown/sat-lightbox": patch
"@mirrordown/sat-mark": patch
"@mirrordown/sat-ruby": patch
"@mirrordown/sat-sectionize": patch
"@mirrordown/sat-slug": patch
"@mirrordown/sat-spoiler": patch
"@mirrordown/sat-squeeze-paragraphs": patch
"@mirrordown/sat-steps": patch
"@mirrordown/sat-tabs": patch
"@mirrordown/sat-unwrap-images": patch
"@mirrordown/core": patch
---

Sätteri 0.11 reads attribute blocks and definition lists the way Mirrordown's other engines do, so the Sätteri suite now covers every feature:

- `preset-satteri` has `attrs` and `definitionList` options, on by default like the other presets, which turn on Sätteri's own `attributes` and `definitionList` features. With them, the preset renders every shared fixture as `preset-remark` and `preset-markdown-it` do.
- The `sat-*` packages accept Sätteri 0.11 as well as 0.10 (`^0.10.5 || ^0.11.0`); Astro's Sätteri integration is still on 0.10, where the plugins work as before.
- An attribute block ending a tab or step header (`% Tab {.tab}`, `@1. Step {.step}`) now goes on the item in `sat-tabs` and `sat-steps`, as in the other engines: Sätteri read it off the header's paragraph before recognition, and the item didn't get it.
- `sat-ruby` parses a ruby's base and reading with the document's features, which Sätteri 0.11.3 and later tell plugins; its `features` option is only needed with an older Sätteri.
