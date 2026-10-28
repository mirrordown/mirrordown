# Changelog

## 0.1.0
<sub>2026-10-28</sub>

- *(minor)*
  Add the caption plugin set: a `~:` line written right after a block captions it, wrapping the block in `<figure class="markdown-caption">` with a `<figcaption>`. Any block can take a caption (an image, paragraph, quote, code, table, list, or the containers other plugins add); a heading, thematic break, raw HTML or another caption can't. An image alone in its paragraph becomes the figure's content, and its alt text stays its alt text. The caption runs to the end of its paragraph and holds inline markdown; the `>` markers and indentation a caption line is written with decide which block it captions, as attrs places a line of attributes, and attributes ending a caption go on the figure. The markdown-it, remark and Sätteri plugins emit identical HTML.
- *(patch)*
  Captioned lightbox images: a lightbox image (`!![alt](src)`) followed by a `~:` caption is now the figure's content, so its trigger sits directly in the `<figure>` without unwrap-images. The lightbox plugins take a `caption` option (off by default) that shows a captioned image's caption under it in the dialog; repeated images share one dialog, which shows the first caption any of them has. The presets pass lightbox options through (`lightbox: { caption: true }`). The lightbox READMEs are now generated from its guide.
