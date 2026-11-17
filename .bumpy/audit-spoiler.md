---
"@mirrordown/mdit-spoiler": patch
"@mirrordown/remd-spoiler": patch
"@mirrordown/sat-spoiler": patch
---

Fixes for cases where a `||spoiler||` formed in one engine and not another, which either hides text you meant to show or shows text you meant to hide.

- **Without `spoilerHastHandlers`, the remark plugin keeps the content covered** (remark). The handlers are still required for a spoiler that can be revealed; this is what happens when they are not passed to `remark-rehype`.

  ```markdown
  a ||b|| c
  ```

  Was `a <div>b</div> c`, the content in the clear. Now `a <span class="markdown-spoiler-content">b</span> c`, which the stylesheet covers and nothing reveals.

- **A spoiler in a table cell forms** (remark, Sätteri). In a cell the pipes have to be written `\|`.

  ```markdown
  | h |
  | - |
  | \|\|x\|\| |
  ```

  Was the text `||x||` in the cell. Now a spoiler, as in markdown-it.

- **An attribute block written right after a spoiler is read and dropped** (Sätteri, with its `attributes` feature on).

  ```markdown
  ||secret||{.danger}
  ```

  Was `<p class="danger">` around the spoiler, and mid-paragraph the block stayed on the page as text. Now the paragraph has no class and the block is gone, as in markdown-it and remark.

- **Escaped pipes stay text after another plugin's span** (remark, Sätteri).

  ```markdown
  ==a== \||b||
  ```

  Was a spoiler around `b`. Now `<mark>a</mark> ||b||`, as in markdown-it.

- **An escape is still honoured after smart punctuation** (Sätteri, with smart punctuation on).

  ```markdown
  "q" \||a||
  ```

  Was a spoiler around `a`. Now `“q” ||a||`.

- **A pipe written as a character reference is not a delimiter** (remark, Sätteri).

  ```markdown
  &#124;&#124;text||
  ```

  Was a spoiler around `text`. Now the text `||text||`.

- **The text of an autolink is left alone** (remark, Sätteri).

  ```markdown
  <http://x/||b||>
  ```

  Was a link with a spoiler around `b` in its text. Now the link text is the URL as written.

- **An escaped character or a character reference beside the pipes counts as punctuation** (remark, Sätteri). This decides whether a pair of pipes can open or close.

  ```markdown
  a||\*b||
  ```

  Was `a` and a spoiler around `*b`. Now the text `a||*b||`, as in markdown-it.

- **A backslash line break right after the opening pipes does not stop them from opening** (remark, Sätteri).

  ```markdown
  (||\
  a||
  ```

  Now a spoiler around the line break and `a`, as in markdown-it.

- **Spoilers nest up to 50 deep** (all engines). The pipes of deeper ones stay text. Sätteri used to reject the whole document when spoilers nested too deep: each one counts twice toward its limit of 128 levels.

The guide now lists the differences between engines that remain.
