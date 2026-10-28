---
"@mirrordown/mdit-lightbox": minor
"@mirrordown/remd-lightbox": minor
"@mirrordown/sat-lightbox": minor
"@mirrordown/mdit-caption": patch
"@mirrordown/remd-caption": patch
"@mirrordown/sat-caption": patch
"@mirrordown/preset-markdown-it": patch
"@mirrordown/preset-remark": patch
"@mirrordown/preset-satteri": patch
"@mirrordown/core": patch
---

Captioned lightbox images: a lightbox image (`!![alt](src)`) followed by a `~:` caption is now the figure's content, so its trigger sits directly in the `<figure>` without unwrap-images. The lightbox plugins take a `caption` option (off by default) that shows a captioned image's caption under it in the dialog; repeated images share one dialog, which shows the first caption any of them has. The presets pass lightbox options through (`lightbox: { caption: true }`). The lightbox READMEs are now generated from its guide.
