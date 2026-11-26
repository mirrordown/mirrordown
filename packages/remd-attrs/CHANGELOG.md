# Changelog










## 0.2.5
<sub>2026-11-26</sub>

- *(patch)* Updated dependency `@mirrordown/core` v0.4.0

## 0.2.4
<sub>2026-11-24</sub>

- *(patch)*
  attrs no longer fails a page over one attribute name, places blocks in linear time, and markdown-it reads on correctly after a block paragraph.

  - **An attribute named `constructor` no longer fails the page** (remark). The serializer remark-rehype hands the tree to throws on a name that lower-cases to `constructor` or `__proto__`, so one block took the whole document down. That one attribute is now left out and the rest of the block applies. markdown-it and Sätteri write the attribute, as before.

    ```markdown
    text {.a constructor=x #b}
    ```

    Was `TypeError: Cannot read properties of undefined (reading 'overloadedBoolean')`. Now `<p class="a" id="b">text</p>`.

  - **A fence or heading right after a block paragraph keeps its own block** (markdown-it). A block paragraph that went on a list, table or rule made markdown-it skip the token after it.

    ````markdown
    ---

    {.h}

    ```js {.x}
    code
    ```
    ````

    Was `<hr class="h"><pre><code class="language-js">…`. Now, as in remark and Sätteri, `<hr class="h"><pre><code class="x language-js">…`.

    ```markdown
    ---

    {.h}

    # H {.g}
    ```

    Was `<hr class="h"><h1>H {.g}</h1>`. Now `<hr class="h"><h1 class="g">H</h1>`.

  - **Several block paragraphs after a list, table or rule all go on it** (markdown-it). The second one was printed as an empty paragraph.

    ```markdown
    | a |
    |---|
    | b |

    {.t}

    {.u}
    ```

    Was `<table class="t">…</table><p class="u"></p>`. Now, as in remark and Sätteri, `<table class="t u">…</table>`.

  - **A fence with a language writes the block's class first** (markdown-it), whatever the block names before it.

    ````markdown
    ```js {data-x=1 .a}
    code
    ```
    ````

    Was `<code data-x="1" class="a language-js">`. Now, as in remark and Sätteri, `<code class="a language-js" data-x="1">`.

  - **Blocks are placed in linear time** (markdown-it and remark). A document with many attribute blocks took time that grew with the square of its length. The output does not change.

    ```markdown
    ![a](a.png)
    {.c}
    ```

    20,000 of these took markdown-it 27 s and now take 0.16 s. 20,000 tables each followed by `{.t}` took 5.5 s and now take 0.44 s. In remark, the plugin's own share for 20,000 list items each with a block on its own line went from 4.4 s to 0.34 s.

## 0.2.3
<sub>2026-11-17</sub>

- *(patch)*
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

## 0.2.2
<sub>2026-11-04</sub>

- *(patch)*
  The attrs plugins do less work per document. markdown-it's plugin now skips a rule as soon as the current token is not the type the rule anchors on, instead of running every rule's full test on every token; remark's plugin builds the source lines and the parent map that only a block on a line of its own needs when it first finds one, instead of on every document. Output is unchanged.

## 0.2.1
<sub>2026-10-28</sub>

- *(patch)*
  The rule for which blocks a line of its own is written in now comes from `@mirrordown/core`, shared with the caption plugins, instead of a copy in each package.

## 0.2.0
<sub>2026-10-28</sub>

- *(minor)*
  Make `mdit-attrs` and `remd-attrs` render identical HTML, following markdown-it-attrs wherever the two disagreed. An attribute line lazily continuing a list's last item (`- a`, `- b`, `{.list}`) now applies to that list, including nested lists, in both engines; it was silently dropped. An attribute block on the line after a hard break now applies to the paragraph and keeps the `<br>` (`mdit-attrs` dropped the class, `remd-attrs` dropped the break). Text consisting only of an attribute block is no longer ignored by either engine's delimiter check. `remd-attrs` now supports attributes after a fence's language (` ```js {.x} `), on table cells (`td` and `th`), and at the end of loose and ordered list items. On fences, `class` is now always the first attribute in both engines (`mdit-attrs` wrote `id` before the language class).
- *(minor)*
  An attribute block on a line of its own now goes on the block it's written after, at the level its `>` markers and indentation put it, as kramdown places a block IAL. Written inside a blockquote or list item, it goes on the paragraph (`> para` then `> {.x}` gives `<p class="x">`), or on the item in a tight list (`- a` then `  {.x}` gives `<li class="x">`). Written outside one, as a lazy continuation line, it goes on that blockquote (`> para` then `{.x}`) or on the item's list (`- a` then `{.x}`), the outermost such block when it leaves several. Both plugins used to give the paragraph every line written inside a blockquote, and the list every line in a list item's first paragraph, whatever its indentation. markdown-it-attrs can't see indentation and gives the line to the outermost block ending with the paragraph; the cases where Mirrordown now differs from it are those where the indentation says otherwise. Inside tab panels and step bodies, the panel's own `>` belongs to the tab: a line written in the panel is placed as it would be at the top level.

  An attribute block right after an inline element now applies when text follows it, as in markdown-it-attrs: `**important**{.warning} text.` gives `<strong class="warning">`, where both plugins kept the block as text unless it ended the text run. Blocks that follow one another merge (`` `npm i`{.cmd}{#install} ``). In `remd-attrs`, inline blocks are also read in headings, table cells and nested elements, and before the heading and list item rules, so `# Title **b**{.x}` gives the `strong` the class, as `mdit-attrs` does. `{.a} {#b}` is no longer read as one block holding `.a} {#b`: only the last block ends the paragraph.

## 0.1.3
<sub>2026-06-28</sub>

- *(patch)*
  Improve JSR package scores: add package descriptions, document all exported symbols (JSDoc), add READMEs for the inline-svg packages, clear slow-type errors on the exported hast handlers, and trim internal regex constants from the public API.

## 0.1.2
<sub>2026-06-28</sub>

- *(patch)*
  First publish to JSR (alongside npm). All 30 packages are claimed on the
  @mirrordown JSR scope with the repo linked, so `npx jsr publish` authenticates
  via GitHub Actions OIDC — no token. Publishes 0.1.2 to npm and JSR together.

## 0.1.1
<sub>2026-06-25</sub>

- *(patch)*
  fix: resolve `catalog:` protocol in published dependencies

  0.1.0 was published with Yarn's `catalog:` specifier left literally in
  `dependencies`/`devDependencies`, so consumers could not install the affected
  packages. Packages are now packed with `yarn pack` (which resolves `catalog:`
  to the concrete version ranges from `.yarnrc.yml`) before `npm publish`.

## 0.1.0

<sub>2026-06-23</sub>

- _(minor)_

  # Initial release

  First public release of the `@mirrordown/markdown` suite — a collection of markdown syntax extensions for the [unified](https://unifiedjs.com/) (remark/rehype) and [markdown-it](https://github.com/markdown-it/markdown-it) ecosystems.

  ## Packages

  **Remark/rehype plugins** (`@mirrordown/remd-*`):
  - `abbr` — abbreviation definitions that auto-expand matching text with `<abbr>` tooltips
  - `attrs` — `{attrs}` syntax for adding HTML attributes to markdown elements
  - `definition-list` — `<dl>`/`<dt>`/`<dd>` syntax from PHP Markdown Extra
  - `del` — `~~strikethrough~~` rendered as `<del>` instead of `<s>`
  - `github-alerts` — `> [!NOTE]` callout boxes matching GitHub's alert syntax
  - `inline-svg` — inlines local `.svg` images into the HTML output with size/occurrence/sprite controls
  - `ins` — `++inserted text++` rendered as `<ins>`
  - `kbd` — `[[Ctrl]]+[[C]]` syntax for `<kbd>` keyboard input elements
  - `mark` — `==highlighted text==` rendered as `<mark>`
  - `ruby` — DenDen-ruby syntax (`{base|reading}`) for `<ruby>`/`<rt>`/`<rp>` annotations
  - `steps` — numbered `@N. step` syntax for procedural guides
  - `sub` — `~subscript~` rendered as `<sub>`
  - `sup` — `^superscript^` rendered as `<sup>`
  - `tabs` — `% Tab` syntax for tabbed content panels
  - `unwrap-images` — lifts block-only images out of wrapping `<p>` tags

  **Markdown-it plugins** (`@mirrordown/mdit-*`): same plugin set, ported for the markdown-it pipeline.

  **VSCode extensions** (`markdown-*`): each plugin wrapped as a VSCode extension that contributes its syntax to the built-in markdown preview. (Publishing to the VSCode Marketplace is wired separately and is not part of this npm release.)

  ## Highlights
  - Designed to work together — `attrs` understands custom container nodes from `tabs`/`steps`/`definition-list`/`github-alerts`, and `tabs`/`steps` nest bidirectionally.
  - Type-aware: every package ships `.d.mts` declarations and externalizes `unist`/`mdast`/`hast` types so downstream consumers see compatible types.
  - Tested: 880 tests covering every plugin's syntax, plus cross-plugin integration tests for nested constructs (tabs-in-steps, attrs-on-defList, github-alerts-with-attrs, etc.).
  - Documented at [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown).
