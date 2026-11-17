---
"@mirrordown/mdit-del": patch
"@mirrordown/remd-del": patch
"@mirrordown/sat-del": patch
---

Fixes for edge cases where the three engines rendered `--deleted--` text differently, or wrongly.

- **An attribute block written right after a deletion goes on the `<del>`** (Sätteri, with its `attributes` feature on).

  ```markdown
  --deleted--{.removed}
  ```

  Was `<p class="removed"><del>deleted</del></p>`, and mid-paragraph the block stayed on the page as text. Now `<p><del class="removed">deleted</del></p>`, as in markdown-it and remark.

- **An escaped delimiter stays text after a deletion earlier in the paragraph** (remark, Sätteri).

  ```markdown
  --a-- \==b==
  ```

  Was `<del>a</del> <mark>b</mark>`. Now `<del>a</del> ==b==`, as in markdown-it. The same holds for `\++`, `\||` and `\[[` when those plugins run after this one.

- **A dash written as a character reference is not a delimiter** (remark, Sätteri).

  ```markdown
  &#45;-a--
  ```

  Was `<del>a</del>`. Now the text `--a--`.

- **The text of an autolink is left alone** (remark, Sätteri).

  ```markdown
  <http://x.com/--a-->
  ```

  Was a link whose text read `http://x.com/<del>a</del>`. Now the link text is the URL as written.

- **An escaped character or a character reference beside the dashes counts as punctuation** (remark, Sätteri). This decides whether a pair of dashes can open or close.

  ```markdown
  a--\*b--
  ```

  Was `a<del>*b</del>`. Now the text `a--*b--`, as in markdown-it. In the other direction, `--a&nbsp;--` was text and is now a deletion.

- **An escape is still honoured after an emoji written as a character reference** (remark, Sätteri).

  ```markdown
  &#x1F600; \--a--
  ```

  Was `😀 <del>a</del>`. Now `😀 --a--`.

- **An abbreviation beside the dashes is read as the word it is** (remark, Sätteri, with the abbr plugin).

  ```markdown
  *[HTML]: Hyper Text

  --(a)--HTML
  ```

  Was `<del>(a)</del><abbr title="Hyper Text">HTML</abbr>`. Now `--(a)--<abbr title="Hyper Text">HTML</abbr>`, as in markdown-it.

- **A backslash line break right after the opening dashes does not stop them from opening** (remark, Sätteri).

  ```markdown
  (--\
  a--
  ```

  Was `(--<br>a--`. Now `(<del><br>a</del>`, as in markdown-it.

- **An emoji or other character outside the Basic Multilingual Plane beside the dashes is read whole** (remark, Sätteri).

  ```markdown
  a--😀b--
  ```

  Was `a<del>😀b</del>`. Now the text `a--😀b--`, as in markdown-it.

- **Deletions nest up to 100 deep** (all engines). The markers of deeper ones stay text. Sätteri used to reject the whole document once spans nested deeper than 128, while markdown-it and remark rendered every level.

- **Private Use characters you typed are kept** (remark, Sätteri). Characters in the range U+F0021 to U+F007E, where some icon fonts put their glyphs, were rewritten to ASCII punctuation, in remark anywhere in the document, code blocks included.

- **A long run of backslashes no longer slows the scan down** (remark, Sätteri). A line of them could take many seconds.

The guide now lists the differences between engines that remain.
