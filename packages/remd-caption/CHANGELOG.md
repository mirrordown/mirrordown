# Changelog




## 0.1.3
<sub>2026-11-26</sub>

- *(patch)* Updated dependency `@mirrordown/core` v0.4.0

## 0.1.2
<sub>2026-11-24</sub>

- *(patch)* Updated dependency `@mirrordown/core` v0.3.0

## 0.1.1
<sub>2026-11-17</sub>

- *(patch)*
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

## 0.1.0
<sub>2026-10-28</sub>

- *(minor)*
  Add the caption plugin set: a `~:` line written right after a block captions it, wrapping the block in `<figure class="markdown-caption">` with a `<figcaption>`. Any block can take a caption (an image, paragraph, quote, code, table, list, or the containers other plugins add); a heading, thematic break, raw HTML or another caption can't. An image alone in its paragraph becomes the figure's content, and its alt text stays its alt text. The caption runs to the end of its paragraph and holds inline markdown; the `>` markers and indentation a caption line is written with decide which block it captions, as attrs places a line of attributes, and attributes ending a caption go on the figure. The markdown-it, remark and Sätteri plugins emit identical HTML.
- *(patch)*
  Captioned lightbox images: a lightbox image (`!![alt](src)`) followed by a `~:` caption is now the figure's content, so its trigger sits directly in the `<figure>` without unwrap-images. The lightbox plugins take a `caption` option (off by default) that shows a captioned image's caption under it in the dialog; repeated images share one dialog, which shows the first caption any of them has. The presets pass lightbox options through (`lightbox: { caption: true }`). The lightbox READMEs are now generated from its guide.
