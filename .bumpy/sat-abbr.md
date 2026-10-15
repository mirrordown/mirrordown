---
"@mirrordown/core": minor
"@mirrordown/remd-abbr": patch
"@mirrordown/sat-abbr": minor
"@mirrordown/preset-satteri": minor
---

New `@mirrordown/sat-abbr`: abbreviations (`*[term]: definition`) for Sätteri, with the same output as `remd-abbr` and `mdit-abbr`, and included in `@mirrordown/preset-satteri`. The definition and term rules move into `@mirrordown/core` (`parseAbbreviations`, `createAbbreviationScan`), which `remd-abbr` now uses too; its output is unchanged.
