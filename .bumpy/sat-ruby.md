---
"@mirrordown/sat-ruby": minor
"@mirrordown/preset-satteri": minor
---

New `@mirrordown/sat-ruby`: ruby annotations (`{base|reading}`) for Sätteri, with the same output as `remd-ruby` and `mdit-ruby`, and no parser changes. It finds rubies in each block's source and re-parses the content around them with each ruby held as a placeholder, so `|` stays a hard delimiter (the base and reading are parsed on their own) and constructs around a ruby wrap it whole. Pass it the document's `features`. In `@mirrordown/preset-satteri` it runs first among the mdast plugins and gets the preset's features.
