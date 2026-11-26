# Changelog






## 0.2.3
<sub>2026-11-26</sub>

- *(patch)* Updated dependency `@mirrordown/core` v0.4.0

## 0.2.2
<sub>2026-11-24</sub>

- *(patch)*
  unwrap-images no longer loses what a paragraph carried: an image alone in a paragraph takes the paragraph's attributes.

  - **One image takes its paragraph's attributes** (all engines): the id, the classes and every other attribute, from an attribute block on its own line or from a block identifier, also when the image is inside a link or a lightbox button. A link to the id finds the image again.

    ```markdown
    ![a](pic.png)
    {#hero .wide}
    ```

    Was `<img src="pic.png" alt="a">`. Now `<img src="pic.png" alt="a" id="hero" class="wide">`.

    ```markdown
    ![a](pic.png) ^img
    ```

    Was `<img src="pic.png" alt="a">`. Now `<img src="pic.png" alt="a" id="^img">`.

  - **The image's own attributes win, and classes add up** (all engines).

    ```markdown
    ![a](pic.png){#own .c}
    {#x .wide}
    ```

    Was `<img src="pic.png" alt="a" id="own" class="c">`. Now `<img src="pic.png" alt="a" id="own" class="c wide">`.

  - **A paragraph with attributes and several images is kept** (all engines): an id can name one element, and a class on a group of images is about the group. Without attributes, several images are unwrapped as before.

    ```markdown
    ![a](a.png) ![b](b.png)
    {.gallery}
    ```

    Was `<img src="a.png" alt="a"> <img src="b.png" alt="b">`. Now `<p class="gallery"><img src="a.png" alt="a"> <img src="b.png" alt="b"></p>`.

  - **A step's title, an alert's title and a lightbox caption are never unwrapped** (remark and Sätteri; markdown-it never did). They are a plugin's own `<p>`, not an image paragraph.

    ```markdown
    @1. ![a](a.png)
    >  body
    ```

    Was, in remark and Sätteri, `<li class="markdown-steps-item" data-step="1"><img src="a.png" alt="a"><div class="markdown-steps-body">…`. Now, as in markdown-it, `<li class="markdown-steps-item" data-step="1"><p class="markdown-steps-title"><img src="a.png" alt="a"></p><div class="markdown-steps-body">…`. The same holds for `> [!note] ![a](a.png)` with `icons: false`, and for a lightbox dialog's caption.

  `@mirrordown/remd-steps`, `@mirrordown/sat-steps`, `@mirrordown/remd-github-alerts` and `@mirrordown/sat-github-alerts` mark the title they build with a property that is never printed (`markdownParagraph: false`), which unwrap-images reads. Their HTML does not change on its own.

  `@mirrordown/core` gains `unwrapImageParagraph` and `MARKDOWN_PARAGRAPH`.

## 0.2.1
<sub>2026-11-17</sub>

- *(patch)*
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

## 0.2.0
<sub>2026-11-11</sub>

- *(minor)*
  Require Sätteri 0.11.3 or later, which Astro ships from 7.4.7 (`@astrojs/markdown-satteri` 0.4.7). The plugins now read the document's features from Sätteri itself, so in Astro `satteriRuby()` needs no `features` passed to it, and tabs and steps no longer allow for a Sätteri that passes none. On Astro 7.4.6 or earlier, update Astro first.

## 0.1.1
<sub>2026-10-28</sub>

- *(patch)*
  Tab and step headers are placed by their `>` markers in remark and Sätteri, as markdown-it reads them. A header right after a paragraph, at its level, interrupts it and starts a group. A header written with a panel's or step body's own `>` is that panel's content: `% Tab` or `@1. Step` there starts a group inside it, and a nested header (`%%`, `@@`) with nothing to nest in stays text. Before, both became the next tab or step of the outer group.
- *(patch)*
  A line written without a tab panel's or step body's `>` right after the last panel now starts a paragraph after the group in remark and Sätteri, as markdown-it reads it, instead of continuing the panel's last paragraph (CommonMark's lazy continuation). The lines after it, and attributes ending them, go with it.
- *(patch)*
  An alert (`> [!NOTE]`) after a step, with a blank line between, is now a block of its own after the steps in every engine, whether or not the alerts plugin reads it. A plain quote there still continues the last step's body. markdown-it took the alert into the body as text, and remark into the body without its title.

## 0.1.0
<sub>2026-10-28</sub>

- *(minor)*
  New `@mirrordown/sat-steps`: numbered step sequences (`@1. Title` with `>` bodies) for Sätteri, with the same output as `remd-steps` and `mdit-steps`, and included in `@mirrordown/preset-satteri` along with its stylesheet. Step recognition moves into `@mirrordown/core` (`processSteps`), which `remd-steps` now uses too; its output is unchanged.
- *(patch)*
  `@mirrordown/sat-steps` writes back only the parts of the tree that step recognition changed, through core's new `editableTree`, so every node it leaves alone stays Sätteri's own and keeps its source position for the plugins after it (tabs reads positions to end a group at a blank line). It also recognizes a step header directly after a list marker (`- @1. Step`), as the remark and markdown-it plugins do.
- *(patch)*
  A step header written right after nested content (`> > Quoted.` then `@2. Next`) starts the next step in every engine. CommonMark lazily continues the nested paragraph with it, so the remark and Sätteri plugins rendered the header as text inside the previous step; they now read the source's `>` markers as markdown-it does, recovering the header and the blockquote structure of the lines after it. `processSteps` takes the document's source for this.
- *(patch)*
  Paragraphs in tab panels and step bodies keep what they had when recognition splits them around a header:

  - A hard break (`line\` then `more`) stays a `<br>` in `remd-tabs`, `remd-steps`, `sat-tabs` and `sat-steps`; it became a plain line break, unlike in `mdit-tabs` and `mdit-steps`.
  - Text split around a header keeps its source position, and the lines left together are one text node again, as remark gives them.
  - In `sat-tabs` and `sat-steps`, a paragraph keeps the attributes Sätteri read from its end. A header right after a panel's last paragraph continues that paragraph in CommonMark, so Sätteri saw the paragraph's attribute block mid-paragraph; with Sätteri's `attributes` feature on, the plugins now place that block once the header is split off, where Sätteri would have.
  - `mdit-tabs` and `mdit-steps` give the panel's opening token its body as `meta.attrsSource`, since the tokens inside index the body's lines, so `mdit-attrs` can read a line's indentation there.
- *(patch)*
  Sätteri 0.11 reads attribute blocks and definition lists the way Mirrordown's other engines do, so the Sätteri suite now covers every feature:

  - `preset-satteri` has `attrs` and `definitionList` options, on by default like the other presets, which turn on Sätteri's own `attributes` and `definitionList` features. With them, the preset renders every shared fixture as `preset-remark` and `preset-markdown-it` do.
  - The `sat-*` packages accept Sätteri 0.11 as well as 0.10 (`^0.10.5 || ^0.11.0`); Astro's Sätteri integration is still on 0.10, where the plugins work as before.
  - An attribute block ending a tab or step header (`% Tab {.tab}`, `@1. Step {.step}`) now goes on the item in `sat-tabs` and `sat-steps`, as in the other engines: Sätteri read it off the header's paragraph before recognition, and the item didn't get it.
  - `sat-ruby` parses a ruby's base and reading with the document's features, which Sätteri 0.11.3 and later tell plugins; its `features` option is only needed with an older Sätteri.
