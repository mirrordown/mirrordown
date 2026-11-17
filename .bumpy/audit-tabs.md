---
"@mirrordown/mdit-tabs": patch
"@mirrordown/remd-tabs": patch
"@mirrordown/sat-tabs": patch
---

Fixes for edge cases where the three engines read `% Tab` headers and their `>` panels differently; the first one changes what markdown-it renders for a panel, inside another block, that holds a blank line written without `>`.

- **Inside a list item, blockquote or step, a blank line without `>` in a panel ends the blocks before it** (markdown-it).

  ```markdown
  - % A
    > - a

    > - b
  ```

  Was one loose list in the panel, `<ul><li><p>a</p></li><li><p>b</p></li></ul>`. Now two lists, `<ul><li>a</li></ul><ul><li>b</li></ul>`, as in remark and Sätteri. This can change an existing document: a list or a code fence in such a panel no longer continues across the blank line (a fence ends there, and the lines after it are read as new blocks). Write the blank line as a lone `>` to keep the list or fence together, which works in every engine. A panel made of paragraphs renders as before, and at the top level of a document a blank line ends the tabs, as it always did.

- **A header ends at the end of its line: a trailing backslash or trailing spaces make no line break** (all engines).

  ```markdown
  % A\
  % B
  > Body.
  ```

  Was, in remark and Sätteri, the paragraph `<p>% A<br></p>` followed by a group holding only B. Now one group with the labels `A\` and `B`, as in markdown-it. Two trailing spaces did the same and are now dropped; markdown-it used to keep a header's trailing spaces in the label and its `aria-label`, and read `%` followed only by a space as a tab with an empty label (it is now the text `%`). A panel line directly before a header no longer ends in `<br>` either.

- **A line that is neither a header nor a `>` line ends the tabs wherever it is written** (remark, Sätteri).

  ```markdown
  % A
  text
  ```

  Was the paragraph `<p>% A\ntext</p>`, with no tabs. Now a group with the tab A, followed by `<p>text</p>`, as in markdown-it.

- **Such a line between a panel and the next header ends the group there** (remark, Sätteri).

  ```markdown
  % A
  > a
  text
  % B
  > b
  ```

  Was one group, with `text` in A's panel. Now a group holding A, then `<p>text</p>`, then a second group holding B, as in markdown-it. Directly after a header that follows a panel (`% Two` then `text`), the line was that tab's panel and now follows the group.

- **Every line of a nested tab's panel stays in the panel** (remark, Sätteri).

  ```markdown
  % A
  %% B
  > one
  > two
  ```

  Was `one` in B's panel and `two` moved out of it, into A's. Now `<p>one\ntwo</p>` in B's panel, as in markdown-it.

- **The lines after the tabs are read as the blocks they are written as** (remark, Sätteri).

  ```markdown
  % One
  > First
  After
  > quoted
  ```

  Was `<p>After\nquoted</p>` after the group. Now `<p>After</p><blockquote><p>quoted</p></blockquote>`, as in markdown-it. With the steps plugin, a tab group written directly under a step's body (`@1. A`, `> body`, `% Tab`, `> t`) is recognised for the same reason; it was the text `% Tab\nt`.

- **A header is found after emphasis, a code span or a link that spans lines** (remark, Sätteri).

  ```markdown
  % A
  > *emph
  > more* text
  % B
  > b
  ```

  Was `<p>% B\nb</p>` at the end of A's panel. Now B is the group's second tab, as in markdown-it.

- **Carriage returns never reach the output** (remark, Sätteri). In a document with CRLF line endings, a panel paragraph followed by a header ended in a carriage return. It now renders as it does with LF.

- **Tabs in a list item end where the item ends** (markdown-it).

  ```markdown
  - % One
  > First.
  ```

  Was `First.` as the tab's panel, inside the item. Now the item holds the tab and `<blockquote><p>First.</p></blockquote>` follows the list, as in remark and Sätteri. A header written outside the item after a blank line likewise starts a group of its own instead of becoming the item's next tab.

- **A header written in a list item after text starts tabs** (remark, Sätteri).

  ```markdown
  - text
    % A
    > a
  ```

  Was the text `% A` and a blockquote. Now `<li>text` followed by the tabs, as in markdown-it.

- **A line written short of a list item's content continues the item** (markdown-it).

  ```markdown
  - item
  % A
  ```

  Was a list followed by a tab group. Now `<li>item\n% A</li>`, as in remark and Sätteri and as CommonMark reads the line; indent the header to the item's content to start tabs there. In the same way `para` after `- % A` and `  > a` was a paragraph after the list and is now text in the item, after the tabs.

- **Inside a list item or blockquote, tabs that a plain line ended are not continued after a blank line** (remark, Sätteri).

  ```markdown
  - % A
    > a
    text

    % B
    > b
  ```

  Was one group, with `text` in A's panel and B as its second tab. Now a group holding A, `<p>text</p>`, and a second group holding B, as in markdown-it.

- **A `>` indented four columns or more is not a panel line** (all engines).

  ```markdown
  % A
      > Body.
  ```

  Was a tab with the panel `<p>Body.</p>` in markdown-it, and the paragraph `<p>% A\n> Body.</p>` with no tabs in remark and Sätteri. Now the tab A with an empty panel, followed by `<p>> Body.</p>`, in every engine. In markdown-it, such a line after a panel line stays in the panel as the text `> b`, and after a blank `>` line it is indented code after the tabs.

- **A header indented four columns or more after text continues the paragraph** (remark, Sätteri).

  ```markdown
  text
      % A
  ```

  Was `<p>text</p>` followed by a tab group. Now `<p>text\n% A</p>`, as in markdown-it.

- **An escaped header is text** (remark, Sätteri).

  ```markdown
  \% A
  > b
  ```

  Was a tab A with the panel `b`. Now `<p>% A</p><blockquote><p>b</p></blockquote>`, as in markdown-it. In remark `%\+ A` and `&#37; A` were tabs too, and are now text.

- **A label that links through a reference definition gives the same `aria-label` and ids as its text** (markdown-it).

  ```markdown
  % [text][foo]
  > Body.

  [foo]: https://example.com
  ```

  Was `aria-label="[text][foo]"`, with a `data-tabs-group` and input ids built from that bracketed text. Now `aria-label="text"` and the ids remark and Sätteri give, which are those of a tab labelled `text`.

- **Tab groups are numbered in the order they are written** (markdown-it, remark). A group's input `name` and `id` include its place among the document's groups, and the engines counted it differently when a group sits in a footnote definition (remark counted it last) or in a `prompt` block's preview (markdown-it counted it last).

  ````markdown
  ```prompt
  % A
  > a
  ```

  % B
  > b
  ````

  Was `name="tabs-4aafe540"` for A and `name="tabs-fdb5a880"` for B in markdown-it. Now `tabs-fdb5a87f` and `tabs-4aafe541`, the ids these two groups have without the prompt block around the first, and the same ids in every engine.

- **`md.parse(src)` without an `env` no longer throws** (markdown-it).

- **A code fence left open at the end of a panel keeps its last line ending** (markdown-it).

  ````markdown
  % A
  > ```
  > code
  % B
  > b
  ````

  Was `<code>code</code>`. Now `<code>code\n</code>`, as in remark and Sätteri.

- **A tab character after a panel's `>` is the marker's space** (markdown-it). A panel line written as `>`, a tab character, then text was indented code; it is now a paragraph, as in remark and Sätteri.

- **A line without any `>` after tabs in a blockquote leaves the blockquote** (remark, Sätteri).

  ```markdown
  > % A
  > > body
  plain
  ```

  Was `<p>plain</p>` inside the blockquote, after the group. Now after the blockquote, as in markdown-it.

- **A tab header in a sub-step's body starts tabs** (remark, Sätteri), with the steps plugin.

  ```markdown
  @1. A
  @@1. B
  > text
  > % Tab
  > > body
  ```

  Was `<p>text\n% Tab</p>` and a blockquote in the sub-step's body. Now `<p>text</p>` followed by the tab group, as in markdown-it.

- **An attribute block on its own line after the tabs goes on the group** (Sätteri).

  ```markdown
  % A
  > a
  {.x}
  ```

  Was dropped. Now `<div class="markdown-tabs x" …>`, as in markdown-it and remark.

- **An attribute block on its own line after content that ended the tabs goes on that content** (remark, Sätteri).

  ```markdown
  % A
  > a
  text
  > q
  {.x}
  ```

  Was `<p class="x">text\nq</p>` in remark and the same paragraph without the class in Sätteri. Now `<p>text</p><blockquote class="x"><p>q</p></blockquote>`, as in markdown-it.

- **Attributes on a panel line under a header that follows a nested quote are kept** (Sätteri).

  ```markdown
  % A
  > > x
  % B
  > b {.y}
  ```

  Was `<p>b</p>` in B's panel. Now `<p class="y">b</p>`, as in markdown-it and remark.

- **`remd-tabs` joins a `className` set by another plugin with the element's own class.** An element given `data.hProperties.className` rendered two `class` attributes, and browsers ignore the second.

The guide's "Things to know" section lists the differences between engines that remain.
