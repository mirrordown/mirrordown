<!-- @case: every marker -->
- [ ] to-do
- [x] done
- [X] done, upper case
- [/] in progress
- [-] cancelled
- [>] forwarded
- [<] scheduled
- [?] question
- [!] important

<!-- @case: a tab in the box is a to-do, as in GFM -->
- [	] to-do

<!-- @case: an ordered list -->
1. [?] question
2. [x] done
3. [ ] to-do

<!-- @case: an ordered list that starts later -->
3. [!] important
4. [/] in progress

<!-- @case: other bullets -->
* [/] in progress
+ [>] forwarded

<!-- @case: a loose list puts the box in the paragraph -->
- [?] question

- [x] done

- [/] in progress

<!-- @case: a loose item keeps its later paragraphs -->
- [<] scheduled

  More about it.

<!-- @case: the list is a task list once, whatever kinds it holds -->
- [ ] to-do
- [x] done
- [?] question
- not a task

<!-- @case: a list of tasks and items that are not -->
- plain
- [!] important
- also plain

<!-- @case: nested lists mixing kinds -->
- [/] in progress
  - [x] done
  - [-] cancelled
    - [ ] to-do
    - [?] question
- [>] forwarded

<!-- @case: a nested list that is not a task list -->
- [?] question
  - plain

<!-- @case: a task in a blockquote -->
> - [x] done
> - [?] question

<!-- @case: a task in a blockquote marked as an alert -->
> [!NOTE]
> - [ ] to-do
> - [!] important

<!-- @case: a task in a list in a list item -->
- - [?] question
  - [x] done

<!-- @case: other markers are text -->
- [b] text
- [1] reference
- [a] option
- [ab] text
- [] empty
- [ x] space before

<!-- @case: a character outside the BMP is not a marker -->
- [😀] text

<!-- @case: formatting after the box -->
- [?] **bold**
- [x] *emphasis*
- [!] `code`
- [/] [a link](https://example.com)

<!-- @case: a second box is text -->
- [x] [?] question
- [?] [x] done

<!-- @case: x: no content after the box -->
- [x]

<!-- @case: ?: no content after the box -->
- [?]

<!-- @case: x: no space after the box -->
- [x]text

<!-- @case: ?: no space after the box -->
- [?]text

<!-- @case: x: a tab after the box -->
- [x]	text

<!-- @case: ?: a tab after the box -->
- [?]	text

<!-- @case: x: two spaces after the box keep one -->
- [x]  text

<!-- @case: ?: two spaces after the box keep one -->
- [?]  text

<!-- @case: x: the text on the next line -->
- [x]
  text

<!-- @case: ?: the text on the next line -->
- [?]
  text

<!-- @case: x: the text on a lazy line -->
- [x]
text

<!-- @case: ?: the text on a lazy line -->
- [?]
text

<!-- @case: x: a backslash line break after a space -->
- [x] \
  text

<!-- @case: ?: a backslash line break after a space -->
- [?] \
  text

<!-- @case: x: a backslash line break right after the box -->
- [x]\
  text

<!-- @case: ?: a backslash line break right after the box -->
- [?]\
  text

<!-- @case: x: the box on a continuation line -->
- text
  [x] more

<!-- @case: ?: the box on a continuation line -->
- text
  [?] more

<!-- @case: ?: the box on the line after an empty list marker -->
-
  [?] text

<!-- @case: x: the box in a later paragraph -->
- text

  [x] more

<!-- @case: ?: the box in a later paragraph -->
- text

  [?] more

<!-- @case: x: an escaped opening bracket -->
- \[x] text

<!-- @case: ?: an escaped opening bracket -->
- \[?] text

<!-- @case: x: an escaped closing bracket -->
- [x\] text

<!-- @case: ?: an escaped closing bracket -->
- [?\] text

<!-- @case: ?: an escaped marker -->
- [\?] text

<!-- @case: x: a character reference for the bracket -->
- &#91;x] text
- [x&#93; text

<!-- @case: ?: a character reference for the bracket -->
- &#91;?] text
- [?&#93; text

<!-- @case: a character reference for the marker -->
- [&#120;] text
- [&#63;] text
- [&#32;] text

<!-- @case: x: a character reference for the space after the box -->
- [x]&#32;text

<!-- @case: ?: a character reference for the space after the box -->
- [?]&#32;text

<!-- @case: x: a non-breaking space after the box -->
- [x] text

<!-- @case: ?: a non-breaking space after the box -->
- [?] text

<!-- @case: the box in a code span -->
- `[x]` text
- `[?]` text

<!-- @case: the box as a link -->
- [x](https://example.com) text
- [?](https://example.com) text

<!-- @case: the box inside a link -->
- [a [?] b](https://example.com)

<!-- @case: the box in a heading -->
# [?] heading

- # [x] heading
- # [?] heading

<!-- @case: ?: the box in a setext heading -->
- [?] heading
  ===

<!-- @case: the box outside a list -->
[x] text

[?] text

<!-- @case: the box in an indented code block -->
-     [?] code

<!-- @case: a task at the very end of the document -->
Some text.

- [?] last
