# Changelog


## 0.1.1
<sub>2026-10-28</sub>

- *(patch)*
  Sätteri ports of the hast plugins: `@mirrordown/sat-squeeze-paragraphs`, `sat-unwrap-images`, `sat-sectionize`, `sat-lightbox` and `sat-autolink-headings`, all included in `@mirrordown/preset-satteri` (whose stylesheet now also imports the lightbox and autolink-headings styles). Their output is identical to the markdown-it and rehype plugins'. `sat-autolink-headings` takes the same options as `remd-autolink-headings`, including the hast-node ones (`content`, `group`, `properties`, `headingProperties`, `test`).

  The rules these engines must compute identically move into `@mirrordown/core` (`isEmptyParagraph`, `isImageParagraph`, `sectionize`, `headingRank`, and the lightbox's marker, ids and markup), which the rehype plugins now use too; their output is unchanged, and squeeze-paragraphs and unwrap-images drop `hast-util-whitespace`.

## 0.1.0
<sub>2026-07-02</sub>

- *(minor)*
  Add the squeeze-paragraphs plugin set: removes empty (whitespace-only) paragraphs — those with no children or only whitespace text. CommonMark never emits an empty paragraph on its own, so this is a cleanup pass for residue left by other transforms (e.g. a comment stripper, or a plugin that lifts an element out of its wrapping paragraph); place it last in the pipeline to tidy that residue. The markdown-it and remark plugins emit identical HTML. Also bundles the `markdown-squeeze-paragraphs` VSCode preview extension in the extension pack.
