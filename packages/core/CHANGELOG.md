# Changelog







## 0.3.0
<sub>2026-11-24</sub>

- *(minor)*
  The alert recognition the three `github-alerts` plugins share reads any type and a marker's metadata.

  - New export `matchAlertMarker(text)` returns the marker at the start of a text (`[!TYPE|metadata]+`) as `{ length, keyword, metadata, fold }`, or `null`. `AlertMarker` is its type. The three plugins and `isAlertMarkerLine` now read a marker through the one pattern.
  - `createAlertResolver(options).resolve(keyword)` normalises the keyword (trimmed, runs of whitespace as `-`, lowercased unless `matchCaseInsensitive` is `false`) and returns it as its own type when no type is registered for it and it holds only letters, marks, numbers, `_` and `-`. It used to return `undefined` for every unregistered keyword; pass `fallback: false` for that.
  - `AlertOptions` gains `fallback`, and `AlertParagraph` gains `metadata`.
  - `titleFor` and `iconFor` give a fallback type a title made from its identifier (`custom-type` is "Custom type") and the note's icon.
- *(minor)*
  Add the tags plugin set: `#tag` in text becomes a link, read the way Obsidian reads a tag, the same in markdown-it, remark and Sätteri. Each plugin also records the document's tags, for the page that lists them.

  - **A `#` followed by a name is a tag.**

    ```markdown
    Filed under #inbox/to-read and #日本語.
    ```

    Renders `<a class="tag" href="#inbox/to-read">#inbox/to-read</a>` and `<a class="tag" href="#日本語">#日本語</a>`.

  - **A name ends where Obsidian ends it:** at whitespace, at ASCII punctuation other than `_`, `-` and `/`, and at the characters of the General Punctuation and Supplemental Punctuation blocks (`…`, `’`, a zero-width joiner). Everything else is part of the name, CJK punctuation included, so leave a space after a tag as you would in Obsidian. A name needs one character that is not a digit: `#1984` is text, `#y1984` is a tag.

    ```markdown
    #tag. and #bob's end at the punctuation. #标签，然后 is one tag.
    ```

    These are the characters Obsidian 1.15.0 was measured to accept, so a site's tags are the ones the vault lists.

  - **A tag starts only where a word could:** at the start of the text, after whitespace, or straight after another tag.

    ```markdown
    abc#def and (#note) are text. #Bob#Alice is two tags.
    ```

    Whitespace written as a character reference does not count (`&nbsp;#tag` is text), and with the kbd plugin a key's content does not open with a tag, so `[[#heading]]`, which links to a heading in Obsidian, adds no tag to a page.

  - **Tags are not read in code, in a link's text, in image alt text or in raw HTML,** so a URL's fragment (`https://example.com/#top`) is never one. A backslash keeps a hash literal: `\#not-a-tag`.

  - **The document's tags are recorded** where each engine keeps per-document data: `env.tags` for markdown-it, `file.data.tags` for remark, `ctx.data.tags` for Sätteri. Names without the `#`, each tag once whatever its casing, in the order they first appear.

    ```ts
    const env = {};
    md.render("Notes from the #meeting for #Inbox and #inbox.", env);
    env.tags; // ["meeting", "Inbox"]
    ```

    In Astro, the remark and Sätteri plugins also add them to the page's frontmatter `tags`, after the tags the frontmatter lists, so `remarkPluginFrontmatter.tags` is the note's tags as Obsidian counts them. A page whose text adds no tag keeps its frontmatter as written.

  - **`tagKey` and `tagAncestors`**, exported by each package, are for building tag pages: `tagKey("Inbox")` is `"inbox"`, since tags are compared ignoring case, and `tagAncestors("inbox/to-read")` is `["inbox", "inbox/to-read"]`, since a nested tag belongs to each tag above it.

  - **The `href` option sets where a tag links to,** for a site that has tag pages. It is called with the name without its `#`.

    ```ts
    remarkTags({ href: (name) => `/tags/${name}` })
    ```

  - **An attribute block is read before tags are.** With the attrs plugin, `{.wide #intro}` gives an id and holds no tag. List the tags plugin after attrs and after the plugins for inline spans (mark, del, ins, kbd, spoiler); in Sätteri list it before the alerts plugin, so a tag can start an alert's title.

  `@mirrordown/core` gains `scanTags`, `tagChildren`, `tagHref`, `createTagCollector`, `tagKey` and `tagAncestors`, the scan and the list the three plugins share.
- *(minor)*
  Highlight variants: a highlight that starts with a marker emoji is a coloured pill, for Obsidian's highlight colours and for label-style badges. A highlight that starts with one of the default markers renders differently than before.

  - **A colour emoji straight after the opening `==` colours the highlight** (all engines), as in Obsidian. The emoji is removed and the colour is named on the `<mark>`.

    ```markdown
    ==🔴Important== and ==🟢 done==
    ```

    Was `<mark>🔴Important</mark>` and `<mark>🟢 done</mark>`. Now `<mark data-highlight="red">Important</mark>` and `<mark data-highlight="green"> done</mark>`. Six colours, each with a circle and a square: 🔴🟥 red, 🟠🟧 orange, 🟡🟨 yellow, 🟢🟩 green, 🔵🟦 blue, 🟣🟪 purple.

  - **Ten label markers name a variant and keep their emoji** (all engines): GitHub's default issue labels and a warning.

    ```markdown
    ==🐛 Bug== ==⚠️ Deprecated==
    ```

    Was plain highlights. Now `<mark data-highlight="bug">🐛 Bug</mark>` and `<mark data-highlight="warning">⚠️ Deprecated</mark>`. The markers are 🐛 `bug`, 📖 `documentation`, ✨ `enhancement`, ❓ `question`, 🙋 `help-wanted`, 🌱 `good-first-issue`, 👯 `duplicate`, 🚫 `invalid`, ⛔ `wontfix` and ⚠️ `warning`. The emoji stays, so a label can be told apart without its colour.

  - **A marker counts only as the highlight's very first character.** `==te🔴xt==` and `==**🔴bold**==` are plain highlights, and a marker written as a character reference is text. `⚠` and `⚠️` are the same marker.

  - **The `markers` option** (all engines) adds a marker, renames one, hides or shows its emoji, or turns a default off.

    ```ts
    remarkMark({
      markers: {
        "🚀": "release", // ==🚀 v2== is <mark data-highlight="release">🚀 v2</mark>
        "✅": { name: "done", keep: false }, // the emoji is removed
        "🟡": false // 🟡 is text again
      }
    })
    ```

  - **A stylesheet draws every variant as a pill** (all engines), in the style of Vocs' badges: a tinted background, text in a stronger shade of the same colour, in a light and a dark scheme. The set shipped no stylesheet before. Import `@mirrordown/mdit-mark/styles`, `@mirrordown/remd-mark/mark.css` or `@mirrordown/sat-mark/mark.css`; without it a variant looks like a plain highlight. A plain `<mark>` keeps the browser's own style. Each default's colour can be set through a custom property, and a variant of your own takes one declaration:

    ```css
    :root { --markdown-mark-bug: oklch(0.6 0.2 5); }
    mark[data-highlight="release"] { --markdown-mark-color: oklch(0.6 0.15 300); }
    ```

  - **A `data-highlight` written in an attribute block wins** (all engines), with the attrs plugin or Sätteri's `attributes` feature.

  The VS Code extension shows the pills in the preview, in light and dark themes.

  `@mirrordown/core` gains `createHighlightMarkers`, `HIGHLIGHT_MARKERS` and the `MarkOptions` type.
- *(minor)*
  Add the image-size plugin set: the size Obsidian reads from an image's description becomes `width` and `height` on the `<img>`, the same in markdown-it, remark and Sätteri.

  - **A description that ends in `|W` or `|WxH` sizes the image.**

    ```markdown
    ![Engelbart|100x145](engelbart.jpg)
    ![Engelbart|100](engelbart.jpg)
    ```

    Renders `<img src="engelbart.jpg" alt="Engelbart" width="100" height="145">` and `<img src="engelbart.jpg" alt="Engelbart" width="100">`. The size leaves the alt text. Only the last `|` is read, so `![a|b|100](…)` has the alt `a|b`.

  - **A description that is only a size leaves the alt empty.**

    ```markdown
    ![250](engelbart.jpg)
    ```

    Renders `<img src="engelbart.jpg" alt="" width="250">`. So an alt text cannot be only a number, or end in `|` and a number.

  - **Nothing else is a size:** `|100px`, `|50%`, `|0`, `|100X145` and a size followed by a space stay in the alt text. A width and a height are one to five digits.

  - **In a GFM table cell, write the pipe as `\|`:** `![chart\|60](chart.png)`.

  - **An attribute block wins.** With the attrs plugin or Sätteri's `attributes` feature, `![a|100](…){width=50}` has `width="50"`.

  The set only writes the two attributes. A host's image pipeline does the rest: Astro's Markdown processors pass them to its image pipeline, which resizes at build time. On a plain page they reserve the image's space; keep `height: auto` in your CSS for images given a width alone.

  `@mirrordown/core` gains `parseImageSize`.
- *(minor)*
  Add the task-lists plugin set: GFM's task lists in markdown-it, and six more task markers in markdown-it, remark and Sätteri, each with a meaning, a label and an icon.

  - **markdown-it renders GFM's task lists**, byte for byte as remark-gfm and Sätteri do.

    ```markdown
    - [ ] to do
    - [x] done
    ```

    Renders `<ul class="contains-task-list"><li class="task-list-item"><input type="checkbox" disabled> to do</li><li class="task-list-item"><input type="checkbox" checked disabled> done</li></ul>`. In remark and Sätteri these two stay GFM's own: the plugin leaves them alone when GFM is on, and reads them itself when it is off.

  - **Six more markers say what state a task is in** (all engines): `/` in progress, `-` cancelled, `>` forwarded, `<` scheduled, `?` question, `!` important. They are the markers the Obsidian community's themes and the Tasks plugin agree on.

    ```markdown
    - [/] writing the guide
    - [?] which licence
    ```

    Renders `<li class="task-list-item" data-task="/"><input type="checkbox" disabled aria-label="In progress"> writing the guide</li>` and `<li class="task-list-item" data-task="?"><input type="checkbox" disabled aria-label="Question"> which licence</li>`. Only `x` is a done task: none of the six is checked, since a task that is in progress, cancelled or put off is not finished. Obsidian itself ticks every box but an empty one.

  - **Any other marker is text.** `- [b] text`, `- [1] reference` and `- [!NOTE] text` render as written.

  - **The `markers` option** (all engines) adds a marker, relabels one, which is also how the labels are translated, or turns one off. **`fallback: true`** reads any single character as a task, as Obsidian does; such a marker gets `data-task` and no label.

    ```ts
    remarkTaskLists({
      markers: {
        b: "Bookmark", // - [b] read later is a task labelled "Bookmark"
        "?": "Frage", // relabelled
        "!": false // - [!] text is text again
      }
    })
    ```

  - **A stylesheet draws an icon for each of the six** (all engines), in its own colour, in a light and a dark scheme: a dashed circle, a square with a minus, an arrow, a calendar, a circle with a question mark and a triangle with an exclamation mark, from Lucide. To-do and done keep the browser's checkbox. Import `@mirrordown/mdit-task-lists/styles`, `@mirrordown/remd-task-lists/task-lists.css` or `@mirrordown/sat-task-lists/task-lists.css`; without it the six show an unchecked box. Each colour takes any CSS colour through a custom property:

    ```css
    :root { --markdown-task-lists-question: oklch(0.6 0.16 300); }
    ```

  - **remark needs the set's handlers for the label.** Pass `taskListsHastHandlers` to `remark-rehype` (`{ handlers: taskListsHastHandlers }`); without them a task renders with an unlabelled box.

  Known difference: in Sätteri a box followed only by an attribute block, `- [?] {.cls}`, is text; markdown-it and remark render a task with no text.

  `@mirrordown/core` gains `createTaskResolver`, `matchTaskBox`, `startAfterBox`, `TASK_MARKERS` and the `TaskListsOptions` type.
- *(minor)*
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
- *(minor)*
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

## 0.2.0
<sub>2026-11-17</sub>

- *(minor)*
  New exports for plugins that split text or place attribute blocks on spans, and fixes to the shared recognition every Mirrordown plugin for remark and Sätteri is built on.

  New exports, all from the package root:

  - `textEscapes(node, source, parentType?, only?, inTableCell?)` returns the indices of a text node's characters that are literal: escaped with a backslash or written as a character reference. It reads them from the node's position in `source`, or from the record a previous scan left on a node it rebuilt.
  - `carryEscapes(piece, escaped, from)` records on a text node you built from part of another one which of its characters were escaped, so a span scan that runs after your plugin still tells `\==` from `==`. Call it for each piece when your plugin splits a text node itself.
  - `scanSpans(transform, parent, host)` runs a span transform over the children of a node in a read-only tree (Sätteri's) and writes the result back through `host`. It finds an enclosing table cell however far up, where `\|` is a pipe and not an escape, and lets each span take the attribute block written right after it. `SpanHost` and `SpanParent` are its types.
  - `createAttributeReader(markdownToMdast)` builds a reader of `{…}` attribute blocks from Sätteri's own parser, so a plugin reads a block exactly as the parser does.
  - `leadingAttributes(value, read)` returns the attribute blocks a text opens with and the text left after them.
  - `claimTrailingAttributes(written, parentType, holders, read)` takes back the block the parser read off the end of a paragraph, list item or heading when it was written touching a span your plugin built (`--x--{.cls}` rather than `--x-- {.cls}`).
  - `addProperties(node, properties)` adds properties to those a built node renders with: classes join the node's own, other attributes replace them.

  Changes to existing exports:

  - **Span transforms** (`createDelimitedTransform`, `createKbdTransform`, and anything run through `SpanTransform`): an escaped character or a character reference stays literal through every scan, not only the first; the text of an autolink (`<https://example.com/--a-->`) is not scanned; the characters beside a delimiter run are classified as markdown-it classifies them; Private Use characters an author typed are no longer rewritten; pairs nested deeper than 100 stay text (`createDelimitedTransform` takes an optional `maxDepth`); and the key scan takes linear time on a line of unclosed `[[`. `createKbdTransform` now lays out a link whose opening bracket is half of a `[[`, so its node type must include links, and `Positioned` now includes `data`.
  - **`maskEscaped`** also masks stand-in characters already in the value, so `unmaskEscaped` gives back exactly the text that went in.
  - **`processSteps`, `processTabs` and `processCaptions`** read CRLF and lone CR line endings and place each line by the source line it is written on, so a header or caption after emphasis or a code span that spans lines is found. Steps and tabs also end a group at a line that is neither a header nor a `>` line wherever it is written, and leave an escaped header as text. `processStepsInChildren` and `processTabsInChildren` take an optional `column`, the column a list item's content starts at.
  - **`TabsListNode`** has a new required field, `blockId`, which `processTabs` sets in document order; read it instead of counting groups yourself. A `stepsItem` or `tabsItem` written with `@@` or `%%` carries `data.sub: true`.
  - **`createAbbreviationScan` and `parseAbbreviations`** match a term between the same boundaries as markdown-it, read definitions from the document's source (so a title may hold another plugin's syntax), and reject a blank term or title.
  - **`lightboxDialog`** writes no caption element for a caption that is empty or only whitespace; its type parameter is now `C extends HastLike`.
  - **`mermaidSvg`** keeps single-quoted, unquoted and value-less attributes of the tag it rewrites, closes a self-closing root, and reads a `>` inside an attribute value as part of the value. **`mermaidDiagram`** takes the last `language-…` class of a `<code>` as its language.
  - **`inlineSvgMarkup`** inserts alt text holding `$` as written, labels a self-closing root before its slash, and with deduplication puts the root's other attributes on each reference.
  - **`createAlertResolver`** no longer resolves a keyword that names a member every object inherits (`constructor`), and matches `types` keys written with capitals; the `titles` option's type accepts a custom type's name. **`splitAlertParagraph`** takes the document's source as an optional second argument, with which an escaped marker is not a marker, and ends the title only at a line break outside inline markup.
  - **`@mirrordown/core/tab-icons`**: the resolver `createTabIconResolver` returns is called as `(label, lead?)`, where `lead` is the label's leading text, and reads a marker only when that text starts with it. Creating a resolver throws a `TypeError` for an icon whose markup does not start with `<svg`. Keys in `icons` are merged without regard to case, and yours are tried before built-in keywords of the same length.
  - **`@mirrordown/core/file-tree`**: `fileTreeIcon` looks up only a table's own keys, so a file named `constructor` gets the icon of an unknown file instead of throwing, and `parseFileTree` reads a long line in linear time.
  - **`@mirrordown/core/prompt`**: `promptServiceTarget` fills in a prompt holding `$$` or `$&` as written.

## 0.1.4
<sub>2026-11-03</sub>

- *(patch)*
  Add the file-tree plugin set, a port of Vocs' File Tree that degrades gracefully: a ` ```filetree ` fence renders as a file tree laid out like VS Code's explorer, and stays a readable code block where the plugin isn't installed, such as on GitHub. Rows nest by indentation, or by the branches the `tree` command draws (Unicode or `--charset=ascii`), or by list markers. `name/` marks a folder and `name/…` one that starts closed; `#` or `//` starts a comment, `**name**` highlights a row, and `[A]` `[M]` `[D]` `[R]` `[U]` `[I]` mark git status. Files get Seti UI's icons and colors as inline SVG, which the `icons` option adds to or replaces. The `theme` option takes a Shiki or VS Code theme, or a light and dark pair, so trees match the code blocks around them; each color can also be set with a `--markdown-file-tree-*` custom property, and a color left out or given an invalid value falls back on its own. Each folder is a `<details>`, so trees open and close without JavaScript, and folder rows stick to the page as their contents scroll past; the optional client script makes each tree an ARIA tree, navigated with the arrow keys. The Markdown File Tree VS Code extension renders trees in the preview in the editor's theme. The markdown-it, remark and Sätteri plugins emit identical HTML.
- *(patch)*
  Give the sub/sup syntax's marker type an explicit definition, so JSR no longer reports a slow type in the public API, and type paragraph attributes so core type-checks on its own, without mdast-util-to-hast's type augmentation loaded.
- *(patch)*
  Show "Copy code" as the copy button's tooltip by default, in the pill its copied text already uses, so an icon-only button says what it does when hovered or focused. `text: { copy: null }` turns it off.
- *(patch)*
  Add the prompt plugin set, a port of Vocs' Prompts that degrades gracefully: a ` ```prompt ` fence renders as a prompt for readers to hand to an AI, collapsed under its title as a `<details>`, with a copy button and buttons to open it in AI services, each with a tooltip that says what it does. Opened, the prompt shows rendered as markdown by the page's own engine, with its syntax and plugins, as part of the page (a prompt inside a prompt stays a code block), and a switch shows its markdown, which is what the buttons copy and send. A prompt with invisible characters (zero-width characters, bidirectional controls, Unicode tags) warns of them, opens on its markdown, and marks each one there. The remark and Sätteri packages each ship two plugins: `remarkPrompt` or `satteriPromptPreview` parses the preview, and `rehypePrompt` or `satteriPrompt` builds the prompt. Where the plugin isn't installed, such as on GitHub, the fence stays a code block. The fence's meta names the services (`claude`, `chatgpt`, `cursor`, `github-copilot`, `grok`, `gemini`, `perplexity`, `copilot`, `mistral`; Claude and ChatGPT by default), `open` shows the prompt, and `title="…"` names it. Every service lands somewhere the reader reviews the prompt before it's sent: those that take it get it through a GET form, which keeps the prompt out of the links a browsing agent reads, and those that would send it at once or can't take it open for the reader to paste it, copied by the client script. The `services`, `defaultServices`, `text`, `highlight` and `forms` options add services, set the defaults and the words, highlight prompts outside a host highlighter, and write links for hosts that don't submit forms. A prompt is a card in the page's colors, as Vocs draws one, and its markdown view takes the host's highlighting as markdown (Astro's Shiki with `prompt` aliased to `markdown`, or markdown-it's `highlight`); each color can be set with a `--markdown-prompt-*` custom property, and falls back on its own. The Markdown AI Prompts VS Code extension renders them in the preview, in the editor's theme. The markdown-it, remark and Sätteri plugins emit identical HTML.

## 0.1.3
<sub>2026-11-02</sub>

- *(patch)*
  Add the copy-code plugin set: every fenced and indented code block gets a copy button, in its `<pre>` after the `<code>`, with no wrapper element. The button is an invoker command (`command="--copy"`) aimed at the `<pre>`, which takes an id from a hash of its code (`code-<hash>`, with `-2`, `-3`… for repeats). Each package ships a small client script (`./client`) that copies the block's code, without the newline markdown ends it with, shows a check with "Copied!" in a pill beside it, as GitHub does, and announces it to screen readers; the buttons render `hidden` until it runs, so a page without it shows none. The `icons` and `text` options set the button's icon and text in each state. Write `nocopy` after the fence's language to leave a block without one; a host that highlights first can keep the meta in a `data-meta` attribute on the `<pre>`. Where CSS anchor positioning with `anchor-scope` is supported, the button sits in the block's top corner and shows on hover or focus. The markdown-it, remark and Sätteri plugins emit identical HTML.

## 0.1.2
<sub>2026-10-28</sub>

- *(patch)*
  Add the tab-icons plugin set, a port of vitepress-plugin-group-icons for Mirrordown's tabs: each tab label gets the icon its text matches (a keyword such as `npm`, `pnpm` or `vite` as a whole word, the longest winning, else a file name or extension such as `package.json` or `.ts`), or the one a `[!keyword]` marker at its start names; `[!none]` turns matching off for one label. The icon is an inline `<svg class="markdown-tab-icon" aria-hidden="true">` before the label's text, and the marker comes out of the label and its panel's `aria-label`. It ships group-icons' built-in icons (from VSCode Icons and SVG Logos); the `icons` option adds or replaces them, with light and dark pairs, and `builtin` and `match` turn the built-in icons and matching off. The markdown-it, remark and Sätteri plugins emit identical HTML.

## 0.1.1
<sub>2026-10-28</sub>

- *(patch)*
  Add the mermaid-pele plugin set: ` ```mermaid ` code blocks render to inline SVG at build time with [Pele](https://pele.run), so diagrams need no JavaScript on the page and no headless browser in the build, and they render in VSCode's preview. The API follows rehype-mermaid's (`prefix`, `errorFallback`, Mermaid `config` as `config`), with Pele's render options passed through; a diagram that fails to render fails the build at its line unless `errorFallback` handles it. Each diagram's ids are prefixed with a hash of its source (and a count for repeats), attributes on the fence (`{#id .class}`) go on the `<svg>`, and the stylesheet themes Pele's CSS variables from the page's `color-scheme`. The markdown-it, rehype and Sätteri plugins emit identical HTML.
- *(patch)*
  Add the caption plugin set: a `~:` line written right after a block captions it, wrapping the block in `<figure class="markdown-caption">` with a `<figcaption>`. Any block can take a caption (an image, paragraph, quote, code, table, list, or the containers other plugins add); a heading, thematic break, raw HTML or another caption can't. An image alone in its paragraph becomes the figure's content, and its alt text stays its alt text. The caption runs to the end of its paragraph and holds inline markdown; the `>` markers and indentation a caption line is written with decide which block it captions, as attrs places a line of attributes, and attributes ending a caption go on the figure. The markdown-it, remark and Sätteri plugins emit identical HTML.
- *(patch)*
  Tab and step headers are placed by their `>` markers in remark and Sätteri, as markdown-it reads them. A header right after a paragraph, at its level, interrupts it and starts a group. A header written with a panel's or step body's own `>` is that panel's content: `% Tab` or `@1. Step` there starts a group inside it, and a nested header (`%%`, `@@`) with nothing to nest in stays text. Before, both became the next tab or step of the outer group.
- *(patch)*
  A line written without a tab panel's or step body's `>` right after the last panel now starts a paragraph after the group in remark and Sätteri, as markdown-it reads it, instead of continuing the panel's last paragraph (CommonMark's lazy continuation). The lines after it, and attributes ending them, go with it.
- *(patch)*
  An alert (`> [!NOTE]`) after a step, with a blank line between, is now a block of its own after the steps in every engine, whether or not the alerts plugin reads it. A plain quote there still continues the last step's body. markdown-it took the alert into the body as text, and remark into the body without its title.
- *(patch)*
  Captioned lightbox images: a lightbox image (`!![alt](src)`) followed by a `~:` caption is now the figure's content, so its trigger sits directly in the `<figure>` without unwrap-images. The lightbox plugins take a `caption` option (off by default) that shows a captioned image's caption under it in the dialog; repeated images share one dialog, which shows the first caption any of them has. The presets pass lightbox options through (`lightbox: { caption: true }`). The lightbox READMEs are now generated from its guide.

## 0.1.0
<sub>2026-10-28</sub>

- *(minor)*
  Backslash-escaped delimiters are now literal in `remd-mark`, `remd-ins`, `remd-del`, `remd-kbd`, `remd-spoiler`, `remd-sub` and `remd-sup`, as they already were in the `mdit-*` plugins: `\==not marked==` renders as `==not marked==` instead of a `<mark>`, while an escaped backslash (`\==marked==`) still allows the markup. These plugins now depend on the new `@mirrordown/core` package, which holds logic shared across Mirrordown's engines.
- *(minor)*
  `mdit-github-alerts` and `remd-github-alerts` now share their alert keywords, default titles, icons, option resolution and (for remark and Sätteri) the marker-line rule through `@mirrordown/core`, instead of keeping duplicate copies. Their output and public exports are unchanged.
- *(minor)*
  `remd-mark` now runs its `==mark==` scan through `createDelimitedTransform` and `MARK_DELIMITERS` from `@mirrordown/core`, which the Sätteri plugin shares, and drops its `unist-util-find-*` and `unist-builder` dependencies. Its output is unchanged.
- *(minor)*
  `~subscript~` and `^superscript^` now parse the same way in markdown-it, remark and Sätteri: a single `~` or `^` is a delimiter run with emphasis-style flanking, its content is inline markup (spaces, emphasis, links, code and each other), and crossing runs resolve leftmost-first.

  - `mdit-sub` and `mdit-sup` used to keep the content as plain text and reject any space inside it. They now parse it as inline markup, so `~*a* b~` renders emphasis and `^a~b~c^` nests.
  - `remd-sub` and `remd-sup` are now micromark syntax extensions sharing one resolver from `@mirrordown/core` (`scriptSyntax`), instead of text scans run one after another. Crossing runs such as `^a~b^c~` no longer depend on which plugin was registered first, `~~a~~` without GFM is no longer turned into empty subscripts, and the packages drop their `unist-util-*` dependencies.
  - The sub guide now shows `remark-gfm` with `singleTilde: false`: GFM's single-tilde strikethrough, which Astro enables by default, otherwise claims `~text~` first.
- *(minor)*
  `==mark==`, `++ins++` and `--del--` now pair delimiters the same way in every engine. `@mirrordown/core`'s `createDelimitedTransform` ports markdown-it's delimiter algorithm (the one markdown-it-mark and markdown-it-ins use), and the remark and Sätteri plugins run on it:

  - A closer pairs with the nearest opener: `==a ==b==` highlights only `b`, as markdown-it does.
  - Spans nest: `==a ==b== c==` is a highlight inside a highlight.
  - The extra marker of an odd-length run stays outside the span (`===a===` → `=<mark>a</mark>=`); `mdit-del` compared against `+` instead of `-` here, so its marker ended up inside.
  - `remd-del` no longer mishandles runs such as `--a --- b--` or `--+a+--`, which came from patterns copied from the ins plugin.

  New Sätteri plugins `@mirrordown/sat-ins` and `@mirrordown/sat-del`, also included in `@mirrordown/preset-satteri`. The `del` guide notes that smart punctuation, on by default in Astro, turns `--` into an en dash before the plugin runs.
- *(minor)*
  `[[key]]` now scans the same way in every engine. `@mirrordown/core`'s new `createKbdTransform` ports markdown-it-kbd's tokenizer, and `remd-kbd` and the new `@mirrordown/sat-kbd` run on it:

  - Keys nest: `[[a [[b]] c]]`.
  - A single `]` stays inside a key: `[[a]b]]`.
  - A line ending before the closing `]]` cancels the key even when formatting sits in between.
  - `[[[a]]` keeps the extra `[` outside the key.

  `remd-kbd` drops its `unist-util-find-*` and `unist-builder` dependencies. One difference is inherent to the engines and documented in the guide: markdown-it reads `[[*a]]*` as a key, while remark and Sätteri have already read the emphasis.

  `@mirrordown/sat-kbd` is included in `@mirrordown/preset-satteri`.
- *(minor)*
  `||spoiler||` now pairs delimiters with markdown-it's rules in every engine: `remd-spoiler` runs on `@mirrordown/core`'s delimiter scan (which gains the `|` marker), so a closer pairs with the nearest opener, spoilers nest, and an odd-length run's extra `|` stays outside; it drops its `unist-util-find-*` and `unist-builder` dependencies.

  New `@mirrordown/sat-spoiler` renders the same JavaScript-free click-to-reveal markup, ships the same stylesheet, and is included in `@mirrordown/preset-satteri`.
- *(minor)*
  Sätteri ports of the hast plugins: `@mirrordown/sat-squeeze-paragraphs`, `sat-unwrap-images`, `sat-sectionize`, `sat-lightbox` and `sat-autolink-headings`, all included in `@mirrordown/preset-satteri` (whose stylesheet now also imports the lightbox and autolink-headings styles). Their output is identical to the markdown-it and rehype plugins'. `sat-autolink-headings` takes the same options as `remd-autolink-headings`, including the hast-node ones (`content`, `group`, `properties`, `headingProperties`, `test`).

  The rules these engines must compute identically move into `@mirrordown/core` (`isEmptyParagraph`, `isImageParagraph`, `sectionize`, `headingRank`, and the lightbox's marker, ids and markup), which the rehype plugins now use too; their output is unchanged, and squeeze-paragraphs and unwrap-images drop `hast-util-whitespace`.
- *(minor)*
  New `@mirrordown/sat-abbr`: abbreviations (`*[term]: definition`) for Sätteri, with the same output as `remd-abbr` and `mdit-abbr`, and included in `@mirrordown/preset-satteri`. The definition and term rules move into `@mirrordown/core` (`parseAbbreviations`, `createAbbreviationScan`), which `remd-abbr` now uses too; its output is unchanged.
- *(minor)*
  New `@mirrordown/sat-steps`: numbered step sequences (`@1. Title` with `>` bodies) for Sätteri, with the same output as `remd-steps` and `mdit-steps`, and included in `@mirrordown/preset-satteri` along with its stylesheet. Step recognition moves into `@mirrordown/core` (`processSteps`), which `remd-steps` now uses too; its output is unchanged.
- *(minor)*
  Tab labels behave the same in every engine:

  - `remd-tabs` keeps a tab's label in the tree, as a `tabsLabel` node that is the first child of each `tabsItem` (the `label` field is gone), so remark plugins that run after it also apply to the label, and a panel's `aria-label` is the label's final text.
  - `data-tabs-group` hashes each label's plain text without a trailing attrs block, as the tabs specification describes. `mdit-tabs` hashed the raw markdown, so labels with links, images, entities or escapes got different ids in markdown-it and remark; labels with a trailing `{…}` change id in both.
  - `mdit-tabs` escapes a panel's `aria-label` once: `npm & yarn` rendered as `aria-label="npm &amp;amp; yarn"`.
  - `mdit-tabs` nests its panel tokens inside the tabs tokens, so `mdit-sectionize` no longer opens a `<section>` around a heading in a tab panel that closed outside the panel.
- *(minor)*
  `@mirrordown/sat-steps` writes back only the parts of the tree that step recognition changed, through core's new `editableTree`, so every node it leaves alone stays Sätteri's own and keeps its source position for the plugins after it (tabs reads positions to end a group at a blank line). It also recognizes a step header directly after a list marker (`- @1. Step`), as the remark and markdown-it plugins do.
- *(minor)*
  A step header written right after nested content (`> > Quoted.` then `@2. Next`) starts the next step in every engine. CommonMark lazily continues the nested paragraph with it, so the remark and Sätteri plugins rendered the header as text inside the previous step; they now read the source's `>` markers as markdown-it does, recovering the header and the blockquote structure of the lines after it. `processSteps` takes the document's source for this.
- *(minor)*
  Tab groups nested in step bodies and other containers work in every engine:

  - Block ids (the radio `name` and input ids) number the document's tab groups in the order they open, combined with the group id, instead of hashing a start line that nested groups don't reliably have. Two groups with the same labels in different steps shared radio names, so the first loaded with no panel open and the second's tabs switched the first. Ids of the first group on a page are unchanged; later groups' ids change. Core exports `tabsBlockId`, and `TabsListNode` no longer carries a `blockId`.
  - `mdit-tabs` keeps a group together across blank lines inside a container (a step body, tab panel, blockquote or list item) when another entry follows, as `remd-tabs` does: the empty `>` lines between entries are the container's own. At the top level a blank line still ends a group.
- *(minor)*
  New `@mirrordown/sat-inline-svg`: inlines referenced local `.svg` images as `<svg>` elements in Sätteri, resolving them against the `fileURL` compile option, with the same output as `mdit-inline-svg` and `remd-inline-svg`. The size limits, deduplication and markup move into `@mirrordown/core` (`inlineSvgMarkup`, `svgSpriteId`), which the markdown-it and rehype plugins now use too; their output is unchanged. Like the other presets, `@mirrordown/preset-satteri` leaves it out because it reads files from disk.
- *(minor)*
  A tab header written right after nested tab content (`> > Option C body.` then `% Code`) starts a tab in the outer group in every engine. CommonMark lazily continues the nested paragraph with it, so the remark and Sätteri plugins put it in the inner group (the tabs guide's own "Default open tab" demo showed `Code` beside `Option C`); they now read the source's `>` markers as markdown-it does, keeping the header at the depth it was written with and the blockquote structure of the lines after it. `processTabs` takes the document's source for this; the marker handling is shared with steps.
- *(minor)*
  A tab header that skips a level no longer loses content in the remark and Sätteri plugins, which dropped it and its body; they now render it as `mdit-tabs` does. In a tab's explicit `> %` body it stays in that panel as text, after any group nested there; in a group of plain `>` bodies it ends the group, and it and the lines after it follow the group as ordinary content, with the blockquotes their `>` markers give. A panel's content now also renders in document order in both plugins, rather than its body before its nested groups.
- *(patch)*
  `@mirrordown/core` declares `"sideEffects": false`, so bundlers drop the parts a plugin doesn't import (the escape helpers, the sub/sup micromark syntax) without having to prove them unused.
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
