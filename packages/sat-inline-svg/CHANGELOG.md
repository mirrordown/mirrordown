# Changelog

## 0.1.0
<sub>2026-10-28</sub>

- *(minor)*
  New `@mirrordown/sat-inline-svg`: inlines referenced local `.svg` images as `<svg>` elements in Sätteri, resolving them against the `fileURL` compile option, with the same output as `mdit-inline-svg` and `remd-inline-svg`. The size limits, deduplication and markup move into `@mirrordown/core` (`inlineSvgMarkup`, `svgSpriteId`), which the markdown-it and rehype plugins now use too; their output is unchanged. Like the other presets, `@mirrordown/preset-satteri` leaves it out because it reads files from disk.
- *(patch)*
  Sätteri 0.11 reads attribute blocks and definition lists the way Mirrordown's other engines do, so the Sätteri suite now covers every feature:

  - `preset-satteri` has `attrs` and `definitionList` options, on by default like the other presets, which turn on Sätteri's own `attributes` and `definitionList` features. With them, the preset renders every shared fixture as `preset-remark` and `preset-markdown-it` do.
  - The `sat-*` packages accept Sätteri 0.11 as well as 0.10 (`^0.10.5 || ^0.11.0`); Astro's Sätteri integration is still on 0.10, where the plugins work as before.
  - An attribute block ending a tab or step header (`% Tab {.tab}`, `@1. Step {.step}`) now goes on the item in `sat-tabs` and `sat-steps`, as in the other engines: Sätteri read it off the header's paragraph before recognition, and the item didn't get it.
  - `sat-ruby` parses a ruby's base and reading with the document's features, which Sätteri 0.11.3 and later tell plugins; its `features` option is only needed with an older Sätteri.
