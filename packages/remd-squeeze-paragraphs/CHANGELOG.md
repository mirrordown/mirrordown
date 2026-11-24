# Changelog




## 0.1.3
<sub>2026-11-24</sub>

- *(patch)* Updated dependency `@mirrordown/core` v0.3.0

## 0.1.2
<sub>2026-11-17</sub>

- *(patch)*
  Fixes that bring the markdown-it plugin in line with the rehype and Sätteri plugins, whose output is unchanged.

  - **A paragraph holding only a non-breaking space or another Unicode space is kept** (markdown-it).

    ```markdown
    a

    &nbsp;

    b
    ```

    Was `<p>a</p><p>b</p>`: the spacer paragraph was removed. Now all three paragraphs render, as in remark and Sätteri. Only a space, tab, line feed, form feed and carriage return count as empty.

  - **An empty `<p>` written by another plugin is removed** (markdown-it). Only paragraphs from Markdown itself used to be. With the steps plugin, a step whose title renders nothing:

    ```markdown
    @1. &#32;
    > Body
    ```

    Was an empty `<p class="markdown-steps-title"> </p>` left in the step. Now it is removed, as in remark and Sätteri.

  - **With `breaks: true`, a paragraph that renders a line break is kept** (markdown-it).

    ```markdown
    &#32;
    &#32;
    ```

    Was removed, although with that option its line ending renders as a `<br>`. Now `<p> <br> </p>`. Without `breaks` it is still removed, in every engine.

  The guide now lists the differences between engines that remain.

## 0.1.1
<sub>2026-10-28</sub>

- *(patch)*
  Sätteri ports of the hast plugins: `@mirrordown/sat-squeeze-paragraphs`, `sat-unwrap-images`, `sat-sectionize`, `sat-lightbox` and `sat-autolink-headings`, all included in `@mirrordown/preset-satteri` (whose stylesheet now also imports the lightbox and autolink-headings styles). Their output is identical to the markdown-it and rehype plugins'. `sat-autolink-headings` takes the same options as `remd-autolink-headings`, including the hast-node ones (`content`, `group`, `properties`, `headingProperties`, `test`).

  The rules these engines must compute identically move into `@mirrordown/core` (`isEmptyParagraph`, `isImageParagraph`, `sectionize`, `headingRank`, and the lightbox's marker, ids and markup), which the rehype plugins now use too; their output is unchanged, and squeeze-paragraphs and unwrap-images drop `hast-util-whitespace`.

## 0.1.0
<sub>2026-07-02</sub>

- *(minor)*
  Add the squeeze-paragraphs plugin set: removes empty (whitespace-only) paragraphs — those with no children or only whitespace text. CommonMark never emits an empty paragraph on its own, so this is a cleanup pass for residue left by other transforms (e.g. a comment stripper, or a plugin that lifts an element out of its wrapping paragraph); place it last in the pipeline to tidy that residue. The markdown-it and remark plugins emit identical HTML. Also bundles the `markdown-squeeze-paragraphs` VSCode preview extension in the extension pack.
