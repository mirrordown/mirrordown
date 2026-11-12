---
"@mirrordown/mdit-squeeze-paragraphs": patch
"@mirrordown/remd-squeeze-paragraphs": patch
"@mirrordown/sat-squeeze-paragraphs": patch
---

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
