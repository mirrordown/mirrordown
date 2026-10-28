---
"@mirrordown/core": minor
"@mirrordown/remd-squeeze-paragraphs": patch
"@mirrordown/remd-unwrap-images": patch
"@mirrordown/remd-sectionize": patch
"@mirrordown/remd-lightbox": patch
"@mirrordown/sat-squeeze-paragraphs": minor
"@mirrordown/sat-unwrap-images": minor
"@mirrordown/sat-sectionize": minor
"@mirrordown/sat-lightbox": minor
"@mirrordown/sat-autolink-headings": minor
"@mirrordown/preset-satteri": minor
---

Sätteri ports of the hast plugins: `@mirrordown/sat-squeeze-paragraphs`, `sat-unwrap-images`, `sat-sectionize`, `sat-lightbox` and `sat-autolink-headings`, all included in `@mirrordown/preset-satteri` (whose stylesheet now also imports the lightbox and autolink-headings styles). Their output is identical to the markdown-it and rehype plugins'. `sat-autolink-headings` takes the same options as `remd-autolink-headings`, including the hast-node ones (`content`, `group`, `properties`, `headingProperties`, `test`).

The rules these engines must compute identically move into `@mirrordown/core` (`isEmptyParagraph`, `isImageParagraph`, `sectionize`, `headingRank`, and the lightbox's marker, ids and markup), which the rehype plugins now use too; their output is unchanged, and squeeze-paragraphs and unwrap-images drop `hast-util-whitespace`.
