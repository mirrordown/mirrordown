---
"@mirrordown/mdit-abbr": patch
"@mirrordown/remd-abbr": patch
"@mirrordown/sat-abbr": patch
---

Fixes that make remark and Sätteri find definitions and terms by the rules markdown-it uses, plus a hang in markdown-it. Several change what existing documents render in remark and Sätteri: which words a term matches, and what a title holds.

- **A term that starts or ends with a symbol or a non-ASCII letter is marked** (remark, Sätteri).

  ```markdown
  *[C++]: See plus plus
  *[.NET]: dot net

  Use C++ and .NET daily.
  ```

  Was plain text, no `<abbr>`. Now both terms are marked, as in markdown-it. The same goes for terms such as `日本` and `café`.

- **A definition whose title or term holds inline syntax is read** (remark, Sätteri).

  ```markdown
  *[HTML]: Hyper *Text* Markup

  HTML
  ```

  Was the definition printed on the page (`*[HTML]: Hyper <em>Text</em> Markup`) and `HTML` left unmarked. Now `<abbr title="Hyper *Text* Markup">HTML</abbr>`, as in markdown-it. The same goes for a title holding a URL, code or raw HTML, a term such as `a*b`, and two definitions separated by a hard line break.

- **A term directly against a letter of another script, a tab or a symbol such as `™` is no longer marked** (remark, Sätteri).

  ```markdown
  *[HTML]: Hyper

  これはHTMLです
  ```

  Was `これは<abbr title="Hyper">HTML</abbr>です`. Now no `<abbr>`, as in markdown-it. `HTML™` and `HTMLé` are no longer marked either, and an underscore now counts as a boundary: `foo_HTML` is marked.

- **A title is the rest of the line as written** (remark, Sätteri).

  ```markdown
  *[RD]: Research &amp; Development

  RD
  ```

  Was a title reading `Research & Development`. Now the title reads `Research &amp; Development`, as in markdown-it: character references and backslash escapes in a title are not decoded.

- **An escaped delimiter after an abbreviation stays text** (remark, Sätteri, with a span plugin such as mark).

  ```markdown
  *[HTML]: Hyper Text

  HTML \==a==
  ```

  Was `<abbr title="Hyper Text">HTML</abbr> <mark>a</mark>`. Now `<abbr title="Hyper Text">HTML</abbr> ==a==`, as in markdown-it.

- **The space around a term and a title is dropped, and a blank term or title is no definition** (all engines).

  ```markdown
  *[ HTML ]: t

  x HTML y
  ```

  Was no `<abbr>` in markdown-it, and `x<abbr title="t"> HTML </abbr>y` in remark and Sätteri. Now `x <abbr title="t">HTML</abbr> y` in all three. `*[ ]: x` used to mark single spaces; it is now ordinary text.

- **Definitions on CRLF lines are read** (remark, Sätteri). A paragraph of two or more definitions saved with Windows line endings was printed instead of read.

- **A term written with an escape or a character reference is found, and one does not act as a word boundary** (markdown-it).

  ```markdown
  *[AT&T]: telco

  AT&amp;T
  ```

  Was no `<abbr>`. Now `<abbr title="telco">AT&amp;T</abbr>`, as in remark and Sätteri. In the other direction, with `HTML` defined, `HTML&#65;` renders `HTMLA` and is no longer marked.

- **An escaped asterisk does not start a definition** (remark, Sätteri).

  ```markdown
  \*[X]: t
  ```

  Was a definition. Now the text `*[X]: t`, as in markdown-it.

- **A definition named after a built-in object property no longer hangs the render** (markdown-it).

  ```markdown
  *[_proto__]: x

  (see) this
  ```

  Was an endless loop until memory ran out. Now `<p>(see) this</p>`.

- **A line that is not a valid definition does not split the paragraph it is in** (markdown-it).

  ```markdown
  foo
  *[X]:
  bar
  ```

  Was two paragraphs, the second starting at `*[X]:`. Now one paragraph, as in remark and Sätteri.

The guide now says what a definition is and where a term is marked, and lists the differences between engines that remain.
