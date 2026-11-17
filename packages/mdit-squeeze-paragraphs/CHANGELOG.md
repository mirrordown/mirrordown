# Changelog



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
  Fixes for differences between the markdown-it and remark plugins that only show up when plugins are combined:

  - `mdit-attrs` no longer reads braces in an image's alt text as a trailing attribute block: `![{.cls}](x.png)` gave its paragraph `class="cls"`. Paragraph, heading and list item attributes now only come from literal text, as in `remd-attrs`.
  - `mdit-squeeze-paragraphs` now judges a paragraph empty by what it renders, as `remd-squeeze-paragraphs` does, so a paragraph that was only an attribute block (`{.note}`) is removed instead of kept as an empty `<p class="note">`.
  - `remd-github-alerts` builds its icons as hast elements instead of a `raw` node, so they render in a default unified pipeline instead of appearing as escaped `<svg>` text unless `allowDangerousHtml` was on. Both engines' icons now close their SVG elements explicitly (`<path …></path>`), which is how rehype serializes them by default.

## 0.1.0
<sub>2026-07-02</sub>

- *(minor)*
  Add the squeeze-paragraphs plugin set: removes empty (whitespace-only) paragraphs — those with no children or only whitespace text. CommonMark never emits an empty paragraph on its own, so this is a cleanup pass for residue left by other transforms (e.g. a comment stripper, or a plugin that lifts an element out of its wrapping paragraph); place it last in the pipeline to tidy that residue. The markdown-it and remark plugins emit identical HTML. Also bundles the `markdown-squeeze-paragraphs` VSCode preview extension in the extension pack.
