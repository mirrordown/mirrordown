---
"@mirrordown/mdit-attrs": patch
"@mirrordown/remd-attrs": patch
---

markdown-it and remark now read an attribute block by the same grammar as Sätteri's built-in `attributes` feature, so the three engines agree on what is a block and what is text. Several of these change what existing documents render: braces that set nothing are no longer removed from the text, a one-letter word in braces is no longer an attribute, and a block written after an alert goes on the alert.

- **Braces that set no attribute stay in the text** (markdown-it, remark).

  ```markdown
  The default is {}
  ```

  Was `<p>The default is</p>`, the braces removed. Now `<p>The default is {}</p>`. The same goes for `{ }`, `{.}`, `{#}`, `{=}` and prose such as `Use {a, b}`, which used to become `<p a,="" b="">Use</p>`.

- **A single letter in braces is not an attribute** (markdown-it, remark).

  ```markdown
  text {x}
  ```

  Was `<p x="">text</p>`. Now `<p>text {x}</p>`. A word of two or more letters is still an attribute with an empty value: `Hello {name}` gives `<p name="">Hello</p>` in every engine.

- **An attribute given twice is written once, with the last value** (markdown-it).

  ```markdown
  text {#a #b}
  ```

  Was `<p id="a" id="b">text</p>`. Now `<p id="b">text</p>`, as in remark and Sätteri. An attribute the element already has is replaced the same way: `[x](/a){href=/b}` used to write two `href`s, of which browsers keep the first, and now links to `/b`. The guide's new security section says what that means for markdown you don't trust.

- **An escaped brace keeps the block as text** (remark).

  ```markdown
  text \{.a}
  ```

  Was `<p class="a">text</p>`. Now `<p>text {.a}</p>`, as in markdown-it and Sätteri. The same goes for an escaped closing brace, a brace written as `&#123;`, and an escaped block after another plugin's span (`--x--\{.a}`).

- **A value can be single-quoted** (markdown-it, remark).

  ```markdown
  text {title='a b'}
  ```

  Was `<p title="'a" b="">text</p>`. Now `<p title="a b">text</p>`. A tab also separates attributes now, as a space does.

- **A malformed block stays text** (markdown-it, remark).

  ```markdown
  text {title="unterminated}
  ```

  Was `<p title="unterminated">text</p>`. Now the text as written. The same goes for a name that is not an attribute name: `{a"b=c}` used to set `ab="c"`.

- **A block on a line after an alert, without its `>`, goes on the alert** (markdown-it, remark, with the github-alerts plugin).

  ```markdown
  > [!NOTE]
  > body
  {.foo}
  ```

  Was `<p class="foo">body</p>` inside the alert. Now the class is on the alert's `<div>`, as it is for a blockquote and as in Sätteri.

- **A task list item gets one `class` attribute** (remark).

  ```markdown
  - [ ] task {.a}
  ```

  Was `<li class="task-list-item" class="a">`, of which browsers drop the second. Now `<li class="a task-list-item">`, as in Sätteri. A block on its own line under a task item used to go on the list and now goes on the item.

- **A fence with no language reads a block of several attributes** (remark).

  ````markdown
  ``` {.a .b}
  code
  ```
  ````

  Was `<code class="language-{.a">`. Now `<code class="a b">`, as in markdown-it and Sätteri.

- **A block after raw HTML or a footnote reference goes on the paragraph** (remark).

  ```markdown
  <span>x</span>{.a}
  ```

  Was the block removed with nothing applied. Now `class="a"` on the `<p>`, as in markdown-it and Sätteri. After a footnote reference the class used to go on the generated `<sup>`.

- **`class` and `id` are one name in any case** (markdown-it).

  ```markdown
  text {CLASS=a}
  ```

  Was `<p CLASS="a">text</p>`. Now `<p class="a">text</p>`, as in remark and Sätteri.

- **A backslash that escapes nothing is part of the value** (markdown-it).

  ```markdown
  text {data-path="C:\dir"}
  ```

  Now `<p data-path="C:\dir">text</p>`, as in remark and Sätteri.

- **An escaped brace in a fence's info string does not open a block** (markdown-it, remark).

  ````markdown
  ```js \{.a}
  code
  ```
  ````

  Now `<code class="language-js">` with no other attribute, as in Sätteri. Character references in a fence's attribute values are decoded once, in markdown-it too.

- **Only the last block ending a heading or a table cell is read** (markdown-it).

  ```markdown
  # H {.a} {.b}
  ```

  Was `<h1 class="b a">H</h1>`. Now `<h1 class="b">H {.a}</h1>`, as in remark and Sätteri.

- **A list of `rule` names covers the same places in both plugins** (markdown-it, remark). A heading's block belongs to `heading`, a cell's to `table`, a list item's to `list`, and `block` covers paragraphs only. With `rule: ["block"]`, `# H {.h}` now renders `<h1>H {.h}</h1>` in both, and `- a {.li}` keeps `{.li}` as text where both used to remove it without applying it.

- **An unknown `rule` name throws** (markdown-it, remark). It used to be ignored.

- **A global or sticky pattern in `allowed` gives the same answer every time** (markdown-it, remark). With `allowed: [/^data-/g]`, the same attribute was kept on one render and dropped on the next.

The guide now documents the options and the grammar, has a security section, and lists where Sätteri differs.
