---
"@mirrordown/mdit-mark": patch
"@mirrordown/remd-mark": patch
"@mirrordown/sat-mark": patch
---

Fixes for edge cases where the three engines rendered `==highlighted==` text differently, or wrongly.

- **An attribute block written right after a highlight goes on the `<mark>`** (Sätteri, with its `attributes` feature on).

  ```markdown
  ==a=={.x}
  ```

  Was `<p class="x"><mark>a</mark></p>`, and mid-paragraph the block stayed on the page as text. Now `<p><mark class="x">a</mark></p>`, as in markdown-it and remark.

- **An escaped delimiter stays text after another plugin's span** (remark, Sätteri).

  ```markdown
  --a-- \==b==
  ```

  Was `<del>a</del> <mark>b</mark>`. Now `<del>a</del> ==b==`, as in markdown-it. The same holds after `++inserted++` text, a `[[key]]` and an abbreviation.

- **An escape is still honoured after smart punctuation or an emoji reference** (remark, Sätteri). With Sätteri's smart punctuation on, `"q" \==a==` now keeps `==a==` as text.

  ```markdown
  &#x1F600; \==a==
  ```

  Was `😀 <mark>a</mark>`. Now `😀 ==a==`.

- **An equals sign written as a character reference is not a delimiter** (remark, Sätteri).

  ```markdown
  &#61;=a==
  ```

  Was `<mark>a</mark>`. Now the text `==a==`.

- **The text of an autolink is left alone** (remark, Sätteri).

  ```markdown
  <http://x.com/==a==>
  ```

  Was a link whose text read `http://x.com/<mark>a</mark>`. Now the link text is the URL as written.

- **An escaped character or a character reference beside the equals signs counts as punctuation** (remark, Sätteri). This decides whether a pair of them can open or close.

  ```markdown
  \!==(a)==
  ```

  Was the text `!==(a)==`. Now `!<mark>(a)</mark>`, as in markdown-it.

- **An abbreviation beside the equals signs is read as the word it is** (remark, Sätteri, with the abbr plugin).

  ```markdown
  *[HTML]: Hyper Text

  a==HTML==
  ```

  Now `a<mark><abbr title="Hyper Text">HTML</abbr></mark>`, as in markdown-it.

- **A backslash line break right after the opening equals signs does not stop them from opening** (remark, Sätteri).

  ```markdown
  (==\
  a==
  ```

  Now `(<mark><br>a</mark>`, as in markdown-it.

- **An emoji or other character outside the Basic Multilingual Plane beside the equals signs is read whole** (remark, Sätteri).

  ```markdown
  a==😀b==
  ```

  Now the text `a==😀b==`, as in markdown-it.

- **Highlights nest up to 100 deep** (all engines). The markers of deeper ones stay text. Sätteri used to reject the whole document once spans nested deeper than 128, and remark could run out of stack on a few thousand levels.

- **Private Use characters you typed are kept** (remark, Sätteri). Characters in the range U+F0021 to U+F007E, where some icon fonts put their glyphs, were rewritten to ASCII punctuation, in remark anywhere in the document, code blocks included.

- **A long run of backslashes no longer slows the scan down** (remark, Sätteri). A line of them could take many seconds.

The guide now lists the differences between engines that remain.
