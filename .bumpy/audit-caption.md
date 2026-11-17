---
"@mirrordown/mdit-caption": patch
"@mirrordown/remd-caption": patch
"@mirrordown/sat-caption": patch
---

Fixes for `~:` caption lines the three engines found in different places, or not at all.

- **A caption is found after emphasis or a code span that spans lines** (all engines).

  ```markdown
  *emph
  more* text
  ~: caption
  ```

  Was, in remark and Sätteri, one paragraph ending in the text `~: caption`. Now a figure around the paragraph with `<figcaption>caption</figcaption>`, as in markdown-it. After a code span that spans lines (`` `a `` then `` b` text ``) no engine found the caption; all three do now.

- **A `~:` inside emphasis or a link's text is text** (markdown-it).

  ```markdown
  ![i](a.jpg) *foo
  ~: bar*
  ```

  Was unbalanced HTML: `<p>… <em>foo</p><figcaption>bar</em></figcaption>`. Now the paragraph `<p><img …> <em>foo\n~: bar</em></p>`, as in remark and Sätteri. The same goes for a link whose text holds the line break.

- **A caption in a task-list item captions the task, not the list** (remark, Sätteri).

  ```markdown
  - [ ] Task
    ~: cap
  - [ ] Two
  ```

  Was one figure around the whole list. Now a figure in the first item, `<figure class="markdown-caption"><p>Task</p><figcaption>cap</figcaption></figure>`, as a caption in any other list item renders. The same was wrong for an item whose content starts on the line after its marker.

- **A `text-align` style written on a caption is kept** (markdown-it), with the attrs plugin.

  ```markdown
  ![x](a.jpg)
  ~: cap {style="text-align:center"}
  ```

  Was `<figure class="markdown-caption">`, the style dropped. Now `<figure class="markdown-caption" style="text-align:center">`, as in remark and Sätteri. A style on a table's caption is kept as well.

- **A caption after a `prompt` block wraps the whole prompt** (markdown-it), with the prompt plugin.

  ````markdown
  ```prompt
  Do the thing
  ```
  ~: A prompt
  ````

  Was a `<figure>` opened inside the prompt's preview and closed outside the prompt. Now `<figure class="markdown-caption"><div class="markdown-prompt">…</div><figcaption>A prompt</figcaption></figure>`, as in remark and Sätteri.

- **A caption line after a link reference definition captions nothing, however the definition is written** (markdown-it).

  ````markdown
  ```
  code
  ```
  [a]:
  b
  ~: cap
  ````

  Was a figure around the code block. Now the code block followed by `<p>~: cap</p>`, as in remark and Sätteri, because the definition stands between the two.

- **Indented code that looks like a link reference definition takes its caption** (markdown-it).

  ```markdown
  Indented:

      [home]: x
  ~: A caption
  ```

  Was the code block followed by `<p>~: A caption</p>`. Now a figure around the code block, as in remark and Sätteri.

- **A backslash ending an inner caption, before an outer caption line, is not a line break** (remark, Sätteri).

  ```markdown
  > > Inner
  > ~: inner\
  ~: outer
  ```

  Was `<figcaption>inner<br></figcaption>`. Now `<figcaption>inner</figcaption>`, as in markdown-it.

- **Carriage returns never reach the output** (remark, Sätteri). In a document with CRLF line endings, a captioned paragraph of several lines ended in a carriage return; in one with lone CR line endings, no caption was found. Both now render as they do with LF.

The guide now says where a caption's rules stop holding.
