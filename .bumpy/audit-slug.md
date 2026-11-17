---
"@mirrordown/mdit-slug": patch
"@mirrordown/remd-slug": patch
"@mirrordown/sat-slug": patch
---

Fixes for heading ids that could repeat, and for two places where markdown-it gave a heading a different id than remark and Sätteri.

- **A generated id never repeats an id written by hand** (all engines).

  ```markdown
  ## B {#b}

  ## B
  ```

  Was `id="b"` on both headings. Now `id="b"` and `id="b-1"`. The hand-written ids are collected first, so the order of the headings doesn't matter, and the `prefix` option is taken into account.

- **An empty id counts as no id** (markdown-it).

  ```markdown
  ## E {id=""}
  ```

  Was `<h2 id="">`. Now `<h2 id="e">`, as in remark and Sätteri.

- **The id is built from all the text a heading shows** (markdown-it). Text that another plugin renders from its own syntax was left out. With the ruby plugin's `rp` set to `["open", "close"]`:

  ```markdown
  ## {漢字|kanji} ruby
  ```

  Was `id="漢字kanji-ruby"`. Now `id="漢字openkanjiclose-ruby"`, as in remark and Sätteri. With the usual `(` and `)` the id is unchanged.
