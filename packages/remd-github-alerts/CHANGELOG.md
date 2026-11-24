# Changelog







## 0.3.0
<sub>2026-11-24</sub>

- *(minor)*
  A callout whose type nobody defined is now a callout, as it is in Obsidian, and a callout can carry metadata. Quotes that begin with a `[!word]` marker render differently than before: read the first two entries.

  - **An undefined type falls back to an alert of its own type** (all engines), when its identifier is made only of letters, numbers, `_` and `-`. It gets the note's icon and colours, and a title made from the identifier.

    ```markdown
    > [!custom-type]
    > Body.
    ```

    Was `<blockquote><p>[!custom-type]`, a plain quote with the marker as text. Now `<div class="markdown-alert" data-alert="custom-type">` titled "Custom type". Style it with `[data-alert="custom-type"]`, or name it in the `titles` option. An identifier with any other character (`[!a.b]`) is still a quote.

  - **`fallback: false` keeps an undefined type a quote** (all engines), for a site that wants only the built-in types and the ones its `types` option registers.

    ```ts
    githubAlerts({ fallback: false })
    ```

  - **The type is read as Obsidian reads it** (all engines): spaces around it are dropped and spaces inside it become `-`, before it is lowercased.

    ```markdown
    > [! NOTE ]
    > Body.

    > [!My type]
    > Body.
    ```

    Was a plain quote for both. Now a note, and an alert of the type `my-type`. Keys of the `types` option are read the same way, so `types: { "Release Notes": "release" }` matches `[!release-notes]`.

  - **A title needs a space before it** (all engines), as in Obsidian and on GitHub.

    ```markdown
    > [!NOTE]Title
    > Body.
    ```

    Was an alert titled "Title". Now a plain quote: write `> [!NOTE] Title`. The same goes for a fold marker (`> [!NOTE]-Title`), an escaped one (`> [!NOTE]\+ Title`), formatting (`> [!NOTE]*Title*`) and an attribute block (`> [!NOTE]{.wide}`) written straight against the marker. The last of these rendered three different ways in the three engines and is now a quote in each.

  - **Text after `|` in the marker is the alert's metadata** (all engines), for a stylesheet to use.

    ```markdown
    > [!info|wide]
    > Body.
    ```

    Was a plain quote. Now `<div class="markdown-alert" data-alert="info" data-alert-metadata="wide">`.

  - **With `matchCaseInsensitive: false`, a built-in type written in another case is an undefined type** (all engines).

    ```markdown
    > [!NOTE]
    > Body.
    ```

    Was a plain quote under that option. Now `<div class="markdown-alert" data-alert="NOTE">` titled "NOTE". Add `fallback: false` to keep the quote.

  - **An alert of a type the stylesheet has no rule for is readable on a dark page** (all engines). Its background was a fixed light colour whatever the colour scheme; it now uses the note's dark colours there. Nothing changes on a light page.

  - **A default title's label has no spaces around it** (Sätteri). With `titles: { note: " Hinweis " }`, `> [!NOTE]` was `aria-label=" Hinweis "` in Sätteri only. Now `aria-label="Hinweis"`, as in markdown-it and remark.
- *(patch)*
  Add the block-ids plugin set: an Obsidian block identifier, `^` and a name at the end of a block, is removed from the text and becomes the block's HTML `id`, so a link to `#^name` finds it in a browser.

  - **A marker at the end of a paragraph names the paragraph** (all engines). It also names it from a last line of its own.

    ```markdown
    The quick purple gem dashes through the paragraph. ^37066d
    ```

    Was `<p>The quick purple gem dashes through the paragraph. ^37066d</p>`. Now `<p id="^37066d">The quick purple gem dashes through the paragraph.</p>`. The `id` keeps the caret: it is the fragment Obsidian writes, and a heading's slug never has one, so the two cannot collide.

  - **In a list item it names the item, in a quote or an alert the outermost quote or alert, and at the end of a heading the heading** (all engines).

    ```markdown
    - Gemmy ^item-1

    ## Setup ^setup
    ```

    Renders `<ul><li id="^item-1">Gemmy</li></ul>` and `<h2 id="^setup">Setup</h2>`. With the slug plugin the heading keeps the marker's id, as it keeps one written as `{#name}`, and that heading's slug is not counted as used.

  - **Alone in its own paragraph it names the block before it** (all engines): a list, a table, a code block, a quote, an alert, a tab group. The marker's paragraph is removed.

    ```markdown
    - list item 1
    - list item 2

    ^my-list
    ```

    Was `<ul>…</ul><p>^my-list</p>`. Now `<ul id="^my-list"><li>list item 1</li><li>list item 2</li></ul>`. With no block before it, the marker is removed and names nothing, as in Obsidian.

  - **Only a marker written as plain text at the very end counts.** It needs a space, a tab or a line start before it and nothing after it, and its name is letters, digits and hyphens. `E = mc^2`, `not-a-marker^abc`, `\^abc`, `*x ^abc*` and a marker followed by a space are text. This is stricter than Obsidian, which also reads `x\[^1` and `*^blk*` as naming a block.

  - **Each element has one id and each identifier one element.** Two markers on one element: the last is its id. One identifier on two blocks: the last block keeps it, as Obsidian resolves a duplicate. An id written with the attrs plugin (`{#name}`) wins over a marker, which is then only removed.

  - **Order matters in remark and Sätteri.** List the plugin after tabs and steps (and, in remark, after attrs): before they run, a tab panel's body is still a plain quote, and a marker in it would name that quote. The presets do this.

  Known cost: a paragraph, heading or list item cannot end in a space and `^word`. `Stop it with ^C` loses `^C` and gets `id="^C"`; write it as code (`` `^C` ``) to keep it.

  `@mirrordown/remd-github-alerts`: an alert's title node records the title its options give the type (`data.defaultTitle`), so `> [!note] ^blk`, whose title was only a marker, is titled by the `titles` option in remark as in the other engines. No output changes on its own.

  `@mirrordown/core` gains `processBlockIds`, `resolveBlockIds`, `trailingMarker`, `cutMarker`, `trimBlankEnd`, `blankAfterMarker`, `titleMarkerWritten` and the `BlockIdEdits` and `BlockMarker` types.
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
  Fixes for alert markers and titles the three engines read differently, and for attributes written on an alert.

  - **An attribute block on the line after an alert, written without `>`, goes on the alert** (all engines), with the attrs plugin or Sätteri's `attributes` feature.

    ```markdown
    > [!NOTE]
    > body
    {.foo}
    ```

    Was `<p class="foo">body</p>` inside the alert in markdown-it, the class on the alert but a title with the class `markdown-alert foo-title` in remark, and no class at all in Sätteri. Now `<div class="markdown-alert foo" data-alert="note">` with the title and body untouched, in every engine. In markdown-it this moves a class that used to land on the body's last paragraph; write the block with the alert's `>` (`> {.foo}`) to keep it there.

  - **A class on an alert no longer changes its title's class** (remark).

    ```markdown
    > [!NOTE]
    > body

    {.foo #bar}
    ```

    Was a title with `class="markdown-alert foo-title"`, which the stylesheet does not match. Now `class="markdown-alert-title"`, as in markdown-it.

  - **The title is formatted by the plugins listed after alerts** (remark), here with the mark plugin.

    ```markdown
    > [!NOTE] ==m== t
    > body
    ```

    Was the title text `==m== t`. Now `<mark>m</mark> t`, as in markdown-it and Sätteri.

  - **A title that breaks inside emphasis or a link stays whole** (markdown-it).

    ```markdown
    > [!NOTE] **bold
    > more** text
    ```

    Was malformed HTML, the `<strong>` opened in the title and closed in the body: `<strong>bold</p><p>more</strong> text</p>`. Now the title `<strong>bold\nmore</strong> text`, as in remark and Sätteri.

  - **An escaped marker is a blockquote** (remark, Sätteri).

    ```markdown
    > \[!NOTE]
    > body
    ```

    Was a note alert. Now `<blockquote><p>[!NOTE]\nbody</p></blockquote>`, as in markdown-it. The same goes for `&#91;!NOTE]`, `[\!NOTE]` and `[!NOTE\]`, and `[!NOTE]\+ plus` is an alert titled `+ plus` instead of a foldable one.

  - **Escaped characters and character references in a title reach its `aria-label`** (markdown-it).

    ```markdown
    > [!NOTE] AT\&T rules
    > body
    ```

    Was `aria-label="ATT rules"`. Now `aria-label="AT&amp;T rules"`, as in remark and Sätteri. A title that is only an escaped character (`\*`) was replaced by the default title, and is now `*`.

  - **A heading that starts with a marker is a heading** (markdown-it).

    ```markdown
    > # [!NOTE] Title
    > body
    ```

    Was a note alert titled `Title`. Now `<blockquote><h1>[!NOTE] Title</h1><p>body</p></blockquote>`, as in remark and Sätteri. The same goes for a marker line underlined with `===` or `---`.

  - **A title without plain text is kept** (all engines).

    ```markdown
    > [!NOTE] ![](x.png)
    > body
    ```

    Was the default title `Note`, the image dropped. Now the image as the title, with `aria-label="Note"`.

  - **`> [!constructor]` no longer throws** (all engines).

    ```markdown
    > [!constructor]
    > body
    ```

    Was a `TypeError` that failed the whole document. Now a plain blockquote, like any other unknown keyword.

  - **A key in `types` written with capitals matches** (all engines). With `types: { Spoiler: "spoiler" }`, neither `> [!Spoiler]` nor `> [!spoiler]` was an alert; both are now, and with `matchCaseInsensitive: false` only the first.

  - **An escaped delimiter in an alert's first paragraph no longer stops the inline plugins there** (remark, Sätteri), here with the mark plugin.

    ```markdown
    > [!NOTE] t \==
    > ==a== \==b== c
    ```

    Was the body `==a== ==b== c`. Now `<mark>a</mark> ==b== c`, as in markdown-it.

  - **An attribute block in the title is left out of the title's `aria-label`** (markdown-it, remark), with the attrs plugin.

    ```markdown
    > [!NOTE] *T*{.foo}
    > body
    ```

    Was `aria-label="T{.foo}"`, and in remark the text `{.foo}` after the `<em>`. Now `aria-label="T"` and `<em class="foo">T</em>`, as in Sätteri. In markdown-it `> [!NOTE]{.foo}` rendered an empty title; it now renders the default title with the class on it.

  - **Lone CR line endings are read as line endings** (remark, Sätteri). A title line and a body line separated by a lone carriage return were one title; they are now a title and a body, as in markdown-it.

  - **`remarkGithubAlerts` renders the title even when `githubAlertsHastHandlers` is not passed to `remark-rehype`.** The title was dropped; it now renders, without its icon.

  - **The `titles` option accepts the name of a custom type in its TypeScript type.** `titles: { spoiler: "Spoiler" }` for a type added through `types` worked at runtime but was a type error.

  The guide now lists the cases the engines still read differently when attributes meet an alert.

## 0.2.0
<sub>2026-10-28</sub>

- *(minor)*
  Make `mdit-github-alerts` and `remd-github-alerts` render identical HTML. `remd` no longer drops the first paragraph of an alert when its first line contains formatting or its body starts with formatting (for example `> [!NOTE]` followed by `> **Bold** text`, which lost the whole body). The marker line now works the same in both engines: everything after `[!TYPE]` on the first line is the title, inline formatting included (`> [!NOTE] *Emphasized* title`), with its plain text (including inline code) as the `aria-label`; everything after the first line break, soft or hard, is the body. The icon SVG is no longer wrapped in a redundant `<span aria-hidden>` (`remd`), and a foldable-open alert emits a bare `open` attribute instead of `open=""` (`mdit`).
- *(patch)*
  `mdit-github-alerts` and `remd-github-alerts` now share their alert keywords, default titles, icons, option resolution and (for remark and Sätteri) the marker-line rule through `@mirrordown/core`, instead of keeping duplicate copies. Their output and public exports are unchanged.
- *(patch)*
  Fixes for differences between the markdown-it and remark plugins that only show up when plugins are combined:

  - `mdit-attrs` no longer reads braces in an image's alt text as a trailing attribute block: `![{.cls}](x.png)` gave its paragraph `class="cls"`. Paragraph, heading and list item attributes now only come from literal text, as in `remd-attrs`.
  - `mdit-squeeze-paragraphs` now judges a paragraph empty by what it renders, as `remd-squeeze-paragraphs` does, so a paragraph that was only an attribute block (`{.note}`) is removed instead of kept as an empty `<p class="note">`.
  - `remd-github-alerts` builds its icons as hast elements instead of a `raw` node, so they render in a default unified pipeline instead of appearing as escaped `<svg>` text unless `allowDangerousHtml` was on. Both engines' icons now close their SVG elements explicitly (`<path …></path>`), which is how rehype serializes them by default.
- *(patch)*
  `remd-github-alerts` applies other plugins' `data` to a blockquote that isn't an alert, as remark-rehype's own handler does, so attributes on a blockquote (`> quote` then `{.note}`) are no longer dropped when alerts are on.

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
