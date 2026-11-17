---
"@mirrordown/mdit-ins": patch
"@mirrordown/remd-ins": patch
"@mirrordown/sat-ins": patch
---

Fixes for edge cases where the three engines rendered `++inserted++` text differently, or wrongly.

- **An attribute block written right after an insertion goes on the `<ins>`** (Sätteri, with its `attributes` feature on).

  ```markdown
  text ++a++{.new} more
  ```

  Was `text <ins>a</ins>{.new} more`, and at the end of a paragraph the class went on the `<p>`. Now `text <ins class="new">a</ins> more`, as in markdown-it and remark.

- **An escaped delimiter stays text after another plugin's span** (remark, Sätteri).

  ```markdown
  --a-- \++b++
  ```

  Was `<del>a</del> <ins>b</ins>`. Now `<del>a</del> ++b++`, as in markdown-it.

- **An escape is still honoured after smart punctuation or an emoji reference** (remark, Sätteri). With Sätteri's smart punctuation on, `"q" \++a++` now keeps `++a++` as text.

  ```markdown
  &#x1F600; \++a++
  ```

  Was `😀 <ins>a</ins>`. Now `😀 ++a++`.

- **A plus written as a character reference is not a delimiter** (remark, Sätteri).

  ```markdown
  &#43;+a++
  ```

  Was `<ins>a</ins>`. Now the text `++a++`.

- **The text of an autolink is left alone** (remark, Sätteri).

  ```markdown
  <http://x.y/++b++>
  ```

  Was a link whose text read `http://x.y/<ins>b</ins>`. Now the link text is the URL as written.

- **An escaped character or a character reference beside the pluses counts as punctuation** (remark, Sätteri). This decides whether a pair of pluses can open or close.

  ```markdown
  x++\*a++
  ```

  Was `x<ins>*a</ins>`. Now the text `x++*a++`, as in markdown-it.

- **An abbreviation beside the pluses is read as the word it is** (remark, Sätteri, with the abbr plugin).

  ```markdown
  *[HTML]: Hyper Text Markup Language

  a++HTML++
  ```

  Was `a++<abbr …>HTML</abbr>++`. Now `a<ins><abbr …>HTML</abbr></ins>`, as in markdown-it.

- **A backslash line break right after the opening pluses does not stop them from opening** (remark, Sätteri).

  ```markdown
  (++\
  a++
  ```

  Now `(<ins><br>a</ins>`, as in markdown-it.

- **An emoji or other character outside the Basic Multilingual Plane beside the pluses is read whole** (remark, Sätteri).

  ```markdown
  a++😀b++
  ```

  Now the text `a++😀b++`, as in markdown-it.

- **Insertions nest up to 100 deep** (all engines). The markers of deeper ones stay text. Sätteri used to reject the whole document once spans nested deeper than 128, while markdown-it and remark rendered every level.

- **Private Use characters you typed are kept** (remark, Sätteri). Characters in the range U+F0021 to U+F007E, where some icon fonts put their glyphs, were rewritten to ASCII punctuation, in remark anywhere in the document, code blocks included.

- **A long run of backslashes no longer slows the scan down** (remark, Sätteri). A line of them could take many seconds.

The guide now lists the differences between engines that remain.
