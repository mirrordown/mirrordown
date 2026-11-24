# Changelog







## 0.2.2
<sub>2026-11-24</sub>

- *(patch)* Updated dependency `@mirrordown/core` v0.3.0

## 0.2.1
<sub>2026-11-17</sub>

- *(patch)*
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

## 0.2.0
<sub>2026-11-11</sub>

- *(minor)*
  Require Sätteri 0.11.3 or later, which Astro ships from 7.4.7 (`@astrojs/markdown-satteri` 0.4.7). The plugins now read the document's features from Sätteri itself, so in Astro `satteriRuby()` needs no `features` passed to it, and tabs and steps no longer allow for a Sätteri that passes none. On Astro 7.4.6 or earlier, update Astro first.

## 0.1.3
<sub>2026-11-03</sub>

- *(patch)*
  Clip tabs to their rounded corners with `overflow: clip` rather than `hidden`, so they're no longer a scroll container: sticky content in a panel, such as a file tree's folder rows, now sticks to the page. `display: flow-root` keeps floats in a panel contained, as before.

## 0.1.2
<sub>2026-10-28</sub>

- *(patch)*
  A tab strip too long for its group now scrolls with a thin scrollbar and fades at each edge that has more labels to scroll to (where scroll-driven animations are supported: Chrome 115+, Safari 26+). A strip that fits doesn't fade.

## 0.1.1
<sub>2026-10-28</sub>

- *(patch)*
  Tab and step headers are placed by their `>` markers in remark and Sätteri, as markdown-it reads them. A header right after a paragraph, at its level, interrupts it and starts a group. A header written with a panel's or step body's own `>` is that panel's content: `% Tab` or `@1. Step` there starts a group inside it, and a nested header (`%%`, `@@`) with nothing to nest in stays text. Before, both became the next tab or step of the outer group.
- *(patch)*
  A line written without a tab panel's or step body's `>` right after the last panel now starts a paragraph after the group in remark and Sätteri, as markdown-it reads it, instead of continuing the panel's last paragraph (CommonMark's lazy continuation). The lines after it, and attributes ending them, go with it.

## 0.1.0
<sub>2026-10-28</sub>

- *(minor)*
  New `@mirrordown/sat-tabs`: tabbed content blocks (`% Label` with `>` bodies) for Sätteri, with the same output as `remd-tabs` and `mdit-tabs`, and included in `@mirrordown/preset-satteri` along with its stylesheet. Recognition is shared with `remd-tabs` through `@mirrordown/core`. A panel's `aria-label` is its label's text when tabs renders, so list `satteriTabs()` after the plugins for inline syntax (the preset does).
- *(minor)*
  Tab groups nested in step bodies and other containers work in every engine:

  - Block ids (the radio `name` and input ids) number the document's tab groups in the order they open, combined with the group id, instead of hashing a start line that nested groups don't reliably have. Two groups with the same labels in different steps shared radio names, so the first loaded with no panel open and the second's tabs switched the first. Ids of the first group on a page are unchanged; later groups' ids change. Core exports `tabsBlockId`, and `TabsListNode` no longer carries a `blockId`.
  - `mdit-tabs` keeps a group together across blank lines inside a container (a step body, tab panel, blockquote or list item) when another entry follows, as `remd-tabs` does: the empty `>` lines between entries are the container's own. At the top level a blank line still ends a group.
- *(patch)*
  A tab header written right after nested tab content (`> > Option C body.` then `% Code`) starts a tab in the outer group in every engine. CommonMark lazily continues the nested paragraph with it, so the remark and Sätteri plugins put it in the inner group (the tabs guide's own "Default open tab" demo showed `Code` beside `Option C`); they now read the source's `>` markers as markdown-it does, keeping the header at the depth it was written with and the blockquote structure of the lines after it. `processTabs` takes the document's source for this; the marker handling is shared with steps.
- *(patch)*
  A tab header that skips a level no longer loses content in the remark and Sätteri plugins, which dropped it and its body; they now render it as `mdit-tabs` does. In a tab's explicit `> %` body it stays in that panel as text, after any group nested there; in a group of plain `>` bodies it ends the group, and it and the lines after it follow the group as ordinary content, with the blockquotes their `>` markers give. A panel's content now also renders in document order in both plugins, rather than its body before its nested groups.
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
