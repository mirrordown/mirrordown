---
"@mirrordown/mdit-definition-list": patch
"@mirrordown/remd-definition-list": patch
---

Fixes for input that markdown-it and remark turned into different definition lists, or into a list where there is none.

- **A heading, list item, blockquote, code fence or thematic break after a definition is not another term** (markdown-it).

  ```markdown
  T
  : D

  # H
  : D2
  ```

  Was `<dt># H</dt><dd>D2</dd>` in the same list. Now the list ends after `D`, followed by `<h1>H</h1><p>: D2</p>`, as in remark. The same goes for `- item`, `> q`, a fence (its lines were read as a term and a definition), `***`, indented code, a link reference definition and, with `html: true`, a line that is an HTML tag.

- **The marker line wins over a setext underline** (markdown-it).

  ```markdown
  Term
  : Def
  ---
  ```

  Was the heading `<h2>Term\n: Def</h2>`. Now `<dl><dt>Term</dt><dd>Def</dd></dl><hr>`, as in remark. With `===` the line is text in the definition.

- **A blank line between a term and its marker keeps the term in the list, inside a blockquote** (remark).

  ```markdown
  > Term
  >
  > : Def
  ```

  Was `<p>Term</p><dl><dd>Def</dd></dl>`, a list without a term. Now `<dl><dt>Term</dt><dd><p>Def</p></dd></dl>`, as in markdown-it.

- **A blank line before a marker makes the definition loose when the marker is indented or in a list item** (remark).

  ```markdown
  - Term

    : Def
  ```

  Was `<dd>Def</dd>`. Now `<dd><p>Def</p></dd>`, as in markdown-it. The same goes for a marker indented at the top level and for a nested definition.

- **A blank line inside a nested list does not make the definition loose** (remark).

  ```markdown
  T
  : para
    - a

      b
  ```

  Was `<dd><p>para</p><ul><li>a</li></ul><p>b</p></dd>`, with `b` outside the list. Now `<dd>para\n<ul><li><p>a</p><p>b</p></li></ul></dd>`, as in markdown-it. A blank line between the items of a nested list, or inside a fenced code block, no longer wraps `para` in `<p>` either.

- **A marker indented four columns or more is not a marker** (markdown-it).

  ```markdown
  Term
      : Def
  ```

  Was a definition list. Now `<p>Term\n: Def</p>`, as in remark; after a blank line the line is indented code.

- **The definition after an empty one stays tight** (remark).

  ```markdown
  T
  :
  : D
  ```

  Was `<dd></dd><dd><p>D</p></dd>`. Now `<dd></dd><dd>D</dd>`, as in markdown-it.

- **A marker on a continuation line of a nested definition nests one level deeper** (remark).

  ```markdown
  a
  : b
    : c
      : d
  ```

  Was `c` and `d` as two definitions of `b`. Now `d` is the definition of the term `c`, nested in the definition of `b`, as in markdown-it.

- **With GFM tables, a row that starts with `:` right after the delimiter row stays in the table** (remark).

  ```markdown
  | a |
  | - |
  : D2
  ```

  Was a table without a body, followed by `<p>: D2</p>`. Now `: D2` is the table's first body row, as in markdown-it and as without the plugin.

- **A marker under a definition's nested list item continues the item's paragraph** (markdown-it).

  ```markdown
  T
  : - a
    : x
  ```

  Was `<ul><li>a</li></ul>` followed by the text `: x`. Now `<li>a\n: x</li>`, as in remark.

- **A tab after the marker inside a blockquote sets the right content column** (markdown-it). A second paragraph indented two columns under `> :`, a tab, then text fell out of the definition; it is now part of it, as in remark.

- **`remarkDefinitionList` renders `<dl>`, `<dt>` and `<dd>` even when `defListHastHandlers` is not passed to `remark-rehype`.** It rendered three nested `<div>` elements.

The guide's markdown-it example now imports the name the package exports, `dl`, and has a section on where Sätteri's built-in definition lists differ.
