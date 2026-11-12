---
"@mirrordown/mdit-sub": patch
"@mirrordown/remd-sub": patch
---

One fix in markdown-it, for emphasis written tightly around a subscript. The remark plugin's output is unchanged.

- **Asterisks directly around a subscript inside a word are emphasis** (markdown-it, with its `strikethrough` rule on, which is the default).

  ```markdown
  H**~2~**O
  ```

  Was `H**<sub>2</sub>**O`. Now `H<strong><sub>2</sub></strong>O`, as in remark with GFM and in Sätteri. With strikethrough off the asterisks stay text in every engine, as before.

- **The same holds beside any tilde, not only a subscript's** (markdown-it, with the plugin installed and `strikethrough` on).

  ```markdown
  x*~~i~~*
  ```

  Was `x*<s>i</s>*`. Now `x<em><s>i</s></em>`, matching the emphasis of remark with GFM and of Sätteri.

The guide now says which plugin takes `~text~` under remark-gfm's single-tilde strikethrough, and what Sätteri's built-in subscript does differently.
