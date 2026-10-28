# Changelog


## 0.1.1
<sub>2026-10-28</sub>

- *(patch)*
  Sätteri ports of the hast plugins: `@mirrordown/sat-squeeze-paragraphs`, `sat-unwrap-images`, `sat-sectionize`, `sat-lightbox` and `sat-autolink-headings`, all included in `@mirrordown/preset-satteri` (whose stylesheet now also imports the lightbox and autolink-headings styles). Their output is identical to the markdown-it and rehype plugins'. `sat-autolink-headings` takes the same options as `remd-autolink-headings`, including the hast-node ones (`content`, `group`, `properties`, `headingProperties`, `test`).

  The rules these engines must compute identically move into `@mirrordown/core` (`isEmptyParagraph`, `isImageParagraph`, `sectionize`, `headingRank`, and the lightbox's marker, ids and markup), which the rehype plugins now use too; their output is unchanged, and squeeze-paragraphs and unwrap-images drop `hast-util-whitespace`.

## 0.1.0
<sub>2026-07-02</sub>

- *(minor)*
  Add the sectionize plugin set: wraps each heading and the content beneath it — up to the next heading of equal or shallower depth — in a semantic `<section data-depth="N">` element, nesting deeper headings inside their ancestors' sections to mirror the document outline. Skipped heading levels nest gracefully (an `<h3>` under an `<h1>` becomes `data-depth="3"` with no invented `<h2>` section) and content before the first heading stays unwrapped. It only wraps and never touches heading ids, so it composes with `slug`/`autolink-headings` when run first. The markdown-it and remark plugins emit identical HTML. Also bundles the `markdown-sectionize` VSCode preview extension in the extension pack.
