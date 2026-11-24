---
"@mirrordown/preset-markdown-it": minor
"@mirrordown/preset-remark": minor
"@mirrordown/preset-satteri": minor
---

Add `blockIds`, on by default like every other feature. Pages rendered with a preset change where a block ends in a space and `^name`.

- **A block identifier becomes the block's `id`.**

  ```markdown
  The quick purple gem dashes through the paragraph. ^37066d
  ```

  Was `<p>The quick purple gem dashes through the paragraph. ^37066d</p>`. Now `<p id="^37066d">The quick purple gem dashes through the paragraph.</p>`.

- **A heading that ends in a marker takes the marker's id instead of a slug.**

  ```markdown
  ## Setup ^setup
  ```

  Was `<h2 id="setup-setup">Setup ^setup</h2>`. Now `<h2 id="^setup">Setup</h2>`, and its anchor link points at `#^setup`.

- **A paragraph that is only a marker is removed**, naming the block before it when there is one.

  ```markdown
  | a |
  | - |
  | b |

  ^results
  ```

  Was a table and `<p>^results</p>`. Now `<table id="^results">…</table>`.

- **Text that happens to end this way changes too.** `Stop it with ^C` was `<p>Stop it with ^C</p>` and is now `<p id="^C">Stop it with</p>`. Write the key as code, or pass `blockIds: false`.
