# Changelog



## 0.2.0
<sub>2026-10-28</sub>

- *(minor)*
  Captioned lightbox images: a lightbox image (`!![alt](src)`) followed by a `~:` caption is now the figure's content, so its trigger sits directly in the `<figure>` without unwrap-images. The lightbox plugins take a `caption` option (off by default) that shows a captioned image's caption under it in the dialog; repeated images share one dialog, which shows the first caption any of them has. The presets pass lightbox options through (`lightbox: { caption: true }`). The lightbox READMEs are now generated from its guide.

## 0.1.1
<sub>2026-10-28</sub>

- *(patch)*
  Sätteri ports of the hast plugins: `@mirrordown/sat-squeeze-paragraphs`, `sat-unwrap-images`, `sat-sectionize`, `sat-lightbox` and `sat-autolink-headings`, all included in `@mirrordown/preset-satteri` (whose stylesheet now also imports the lightbox and autolink-headings styles). Their output is identical to the markdown-it and rehype plugins'. `sat-autolink-headings` takes the same options as `remd-autolink-headings`, including the hast-node ones (`content`, `group`, `properties`, `headingProperties`, `test`).

  The rules these engines must compute identically move into `@mirrordown/core` (`isEmptyParagraph`, `isImageParagraph`, `sectionize`, `headingRank`, and the lightbox's marker, ids and markup), which the rehype plugins now use too; their output is unchanged, and squeeze-paragraphs and unwrap-images drop `hast-util-whitespace`.

## 0.1.0
<sub>2026-06-29</sub>

- *(minor)*
  Add the lightbox plugin set: opt an image into a JavaScript-free, click-to-zoom `<dialog>` lightbox with a leading `!!` (e.g. `!![Alt](photo.jpg)`). The image becomes a `<button>` trigger that opens a modal `<dialog>` — open, close, backdrop dismiss, `Esc`, focus trapping, and the zoom/fade animation are all declarative HTML and CSS (`<dialog>` + Invoker Commands + `closedby` + `@starting-style`), so it works where scripts are disabled, such as the VSCode preview. The dialog `id` is a stable hash of the image `src`, so repeated references to the same image share one dialog; an author `{#id}` (via attrs) overrides it; images inside links are left untouched. The markdown-it and rehype plugins emit identical HTML.
