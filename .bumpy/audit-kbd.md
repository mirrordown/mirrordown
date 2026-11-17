---
"@mirrordown/mdit-kbd": patch
"@mirrordown/remd-kbd": patch
"@mirrordown/sat-kbd": patch
---

Fixes for edge cases where the three engines read `[[key]]` differently. Two of them change what existing documents render: in remark and Sätteri a key now wins over a link that shares its brackets, and in markdown-it a key now treats inline code, links and line breaks inside it as the other engines do.

- **A key whose name is also a link reference is a key** (remark, Sätteri).

  ```markdown
  [[a]]

  [a]: /u
  ```

  Was `[<a href="/u">a</a>]`. Now `<kbd>a</kbd>`, as in markdown-it.

- **A key followed by parentheses or a reference is a key, not a link** (remark, Sätteri).

  ```markdown
  [[a]](url)
  ```

  Was `<a href="url">[a]</a>`. Now `<kbd>a</kbd>(url)`, as in markdown-it. Likewise `[[a]][ref]` is a key followed by the link `ref`, and `![[a]]` is `!` and a key.

- **An attribute block written right after a key goes on the `<kbd>`** (Sätteri, with its `attributes` feature on).

  ```markdown
  x [[Ctrl]]{.key} y
  ```

  Was `x <kbd>Ctrl</kbd>{.key} y`, and at the end of a paragraph the class went on the `<p>`. Now `x <kbd class="key">Ctrl</kbd> y`, as in markdown-it and remark.

- **Closing brackets inside inline code, an autolink or an HTML tag do not close the key** (markdown-it).

  ```markdown
  [[a `]]` b]]
  ```

  Was ``<kbd>a <code>]]</code></kbd>` b]]``. Now `<kbd>a <code>]]</code> b</kbd>`, as in remark and Sätteri.

- **A link inside a key is part of the key** (markdown-it).

  ```markdown
  [[x [a]]]

  [a]: /u
  ```

  Was `<kbd>x [a</kbd>]`. Now `<kbd>x <a href="/u">a</a></kbd>`, as in remark and Sätteri.

- **A backslash line break ends the key attempt** (markdown-it).

  ```markdown
  [[a\
  b]]
  ```

  Was `<kbd>a<br>b</kbd>`. Now the text `[[a<br>b]]`, as in remark and Sätteri. A code span that runs over a line ending inside a key no longer stops the key either.

- **An escaped key stays text after another plugin's span** (remark, Sätteri).

  ```markdown
  --a-- \[[x]]
  ```

  Was `<del>a</del> <kbd>x</kbd>`. Now `<del>a</del> [[x]]`, as in markdown-it.

- **An escape is still honoured after smart punctuation** (Sätteri, with smart punctuation on).

  ```markdown
  "q" \[[x]] [[y]]
  ```

  Was `“q” <kbd>x</kbd> <kbd>y</kbd>`. Now `“q” [[x]] <kbd>y</kbd>`. The same went wrong in remark and Sätteri after a character reference that decodes to two characters, such as an emoji.

- **A bracket written as a character reference is not a bracket** (remark, Sätteri).

  ```markdown
  &#91;[x]]
  ```

  Was `<kbd>x</kbd>`. Now the text `[[x]]`.

- **Keys nest up to 100 deep** (remark, Sätteri). Deeper brackets stay text, as in markdown-it. remark used to overflow the stack on a few thousand levels and Sätteri rejected the whole document past 128.

- **A line of unclosed `[[` is scanned in linear time** (all engines). 40 KB of them took about seven seconds.

- **A lone carriage return is a line ending, so no key forms across it** (remark, Sätteri).

- **Private Use characters you typed are kept** (remark, Sätteri). Characters in the range U+F0021 to U+F007E, where some icon fonts put their glyphs, were rewritten to ASCII punctuation, so two of them could even turn into brackets.

The guide now says that a key wins over a link, and lists the differences between engines that remain.
