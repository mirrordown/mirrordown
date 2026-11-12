---
"@mirrordown/mdit-steps": patch
"@mirrordown/remd-steps": patch
"@mirrordown/sat-steps": patch
---

Fixes for edge cases where the three engines read `@1. Step` headers and their `>` bodies differently; the first one changes what markdown-it renders for a body that holds a blank line written without `>`.

- **A blank line without `>` inside a body ends the blocks before it** (markdown-it).

  ```markdown
  @1. S
  > - a

  > - b
  ```

  Was one loose list, `<ul><li><p>a</p></li><li><p>b</p></li></ul>`. Now two lists, `<ul><li>a</li></ul><ul><li>b</li></ul>`, as in remark and Sätteri. This can change an existing document: a list or a code fence in a body no longer continues across such a line (a fence ends there, and the lines after it are read as new blocks). Write the blank line as a lone `>` to keep the list or fence together, which works in every engine. A body made of paragraphs renders as before.

- **A header ends at the end of its line: a trailing backslash or trailing spaces make no line break** (all engines).

  ```markdown
  @1. Title\
  @1. Two
  ```

  Was, in remark and Sätteri, the title `Title<br>` and a second list started by `@1. Two`. Now one list with the titles `Title\` and `Two`, as in markdown-it. Two trailing spaces did the same and are now dropped; markdown-it used to keep a header's trailing spaces in the title. A body line directly before a header is read the same way, so `> body\` no longer ends in `<br>`.

- **Every line of a sub-step's body stays in the sub-step** (remark, Sätteri).

  ```markdown
  @1. A
  @@1. B
  > line one
  > line two
  ```

  Was `line one` in B's body and `line two` moved into A's body. Now `<p>line one\nline two</p>` in B's body, as in markdown-it. The same applies to a tab group in a sub-step's body, whose panel lost every line after its first.

- **A line that is neither a header nor a `>` line ends the steps wherever it is written** (remark, Sätteri).

  ```markdown
  @1. A
  > a
  text
  @1. B
  > b
  ```

  Was one list, with `text` in A's body and B as step 2. Now a list holding A, then `<p>text</p>`, then a new list where B is step 1, as in markdown-it. The same holds directly after a header that follows a body (`@1. Two` then `text`: the line was that step's body, and now follows the list), and when a blank line separates the line from the next header.

- **The lines after the steps are read as the blocks they are written as** (remark, Sätteri).

  ```markdown
  @1. A
  > body
  plain
  > quote
  ```

  Was `<p>plain\nquote</p>` after the list. Now `<p>plain</p><blockquote><p>quote</p></blockquote>`, as in markdown-it. A tab group written directly under the steps (`% Tab` then `> t`) is recognised for the same reason; it was the text `% Tab\nt`.

- **A header is found after emphasis, a code span or a link that spans lines** (remark, Sätteri).

  ```markdown
  @1. A
  > *emph
  > more* text
  @1. B
  ```

  Was B rendered as a new list inside A's body. Now B is step 2, as in markdown-it.

- **A step without content has no body element** (markdown-it).

  ```markdown
  @1. A


  @1. B
  ```

  Was an empty `<div class="markdown-steps-body"></div>` in step A, which the stylesheet pads. Now no body element, as in remark and Sätteri. A lone `>` between two headers is treated the same.

- **Carriage returns never reach the output** (remark, Sätteri). In a document with CRLF line endings, a title followed by another header and a body paragraph followed by a header ended in a carriage return; in one with lone CR line endings, a header after a body was not seen at all. Both now render as they do with LF.

- **Steps in a list item end where the item ends** (markdown-it).

  ```markdown
  - @1. Step
  > Body
  ```

  Was `Body` as the step's body, inside the item. Now the item holds the step and `<blockquote><p>Body</p></blockquote>` follows the list, as in remark and Sätteri. A header written outside the item after a blank line likewise starts a list of its own instead of becoming the item's next step.

- **A header written in a list item after text starts steps** (remark, Sätteri).

  ```markdown
  - text
    @1. Step
    > Body.
  ```

  Was the text `@1. Step` and a blockquote. Now `<li>text` followed by the steps, as in markdown-it.

- **A line written short of a list item's content continues the item** (markdown-it).

  ```markdown
  - item
  @1. Step
  ```

  Was a list followed by steps. Now `<li>item\n@1. Step</li>`, as in remark and Sätteri and as CommonMark reads the line; indent the header to the item's content to start steps there. In the same way `para` after `- @1. A` and `  > a` was a paragraph after the list and is now text in the item, after the steps.

- **A `>` indented four columns or more is not a body line** (markdown-it).

  ```markdown
  @1. S
      > body
  ```

  Was a step with the body `<p>body</p>`. Now the step without a body, followed by `<p>> body</p>`, as in remark and Sätteri. After a body line such a line stays in the body as the text `> b`, and after a blank line it is indented code.

- **A header indented four columns or more after text continues the paragraph** (remark, Sätteri).

  ```markdown
  text
      @1. Step
  ```

  Was `<p>text</p>` followed by steps. Now `<p>text\n@1. Step</p>`, as in markdown-it.

- **An escaped header is text** (remark, Sätteri).

  ```markdown
  \@1. Title
  ```

  Was a step titled `Title`. Now `<p>@1. Title</p>`, as in markdown-it. In remark `@1\. A` and `&#64;1. Title` were steps too, and are now text.

- **A quote that starts with an alert marker directly under a header is the step's body** (remark, Sätteri).

  ```markdown
  @1. S
  > [!NOTE]
  > text
  ```

  Was a step without a body, followed by a blockquote. Now the body `<p>[!NOTE]\ntext</p>`, as in markdown-it. The marker ends the steps only after a blank line and at the body's own `>`.

- **A nested quote that starts with an alert marker stays in the body** (all engines).

  ```markdown
  @1. S
  > body

  > > [!NOTE]
  > > text
  ```

  Was the end of the steps, with two nested blockquotes after the list. Now `<blockquote><p>[!NOTE]\ntext</p></blockquote>` in the body, after `<p>body</p>`. Directly under a header, remark and Sätteri ended the steps at it as well.

- **A code fence left open at the end of a body keeps its last line ending** (markdown-it).

  ````markdown
  @1. A
  > ```
  > code
  @1. B
  ````

  Was `<code>code</code>`. Now `<code>code\n</code>`, as in remark and Sätteri.

- **A tab after a body's `>` is the marker's space** (markdown-it). A body line written as `>`, a tab, then text was indented code; it is now a paragraph, as in remark and Sätteri.

- **A line without any `>` after steps in a blockquote leaves the blockquote** (remark, Sätteri).

  ```markdown
  > @1. A
  > > body
  plain
  ```

  Was `<p>plain</p>` inside the blockquote, after the list. Now after the blockquote, as in markdown-it.

- **An attribute block on its own line after the steps goes on the list** (Sätteri).

  ```markdown
  @1. A
  > body
  {.x}
  ```

  Was dropped (and after a step without a body, put on the step). Now `<ol class="markdown-steps x">`, as in markdown-it and remark.

- **A title that is only an attribute block renders no title** (markdown-it, remark).

  ```markdown
  @1. {.a}
  > body
  ```

  Was an empty `<p class="markdown-steps-title"></p>` in the step. Now the step has the class `a` and no title element, as in Sätteri.

- **An attribute block on its own line after content that ended the steps goes on that content** (remark, Sätteri).

  ```markdown
  @1. A
  > a
  text
  > q
  {.x}
  ```

  Was `<p class="x">text\nq</p>` in remark and the same paragraph without the class in Sätteri. Now `<p>text</p><blockquote class="x"><p>q</p></blockquote>`, as in markdown-it.

- **Attributes on a header written under a nested quote are kept** (Sätteri).

  ```markdown
  @1. A
  > > x
  @1. B {.y}
  ```

  Was step B without its class. Now `<li class="markdown-steps-item y" data-step="2">`, as in markdown-it and remark. A body line after such a header keeps its attributes too.

- **A step header in a tab panel is recognised when `satteriTabs()` is listed before `satteriSteps()`** (Sätteri).

  ```markdown
  % A
  > text
  > @1. S
  > > body
  ```

  Was the text `@1. S` and a blockquote in the panel. Now `<p>text</p>` followed by the steps, as in markdown-it and as with steps listed first.

- **`remd-steps` joins a `className` set by another plugin with the element's own class.** A step or list given `data.hProperties.className` rendered two `class` attributes, and browsers ignore the second.

The guide's new "Things to know" section lists the differences between engines that remain.
