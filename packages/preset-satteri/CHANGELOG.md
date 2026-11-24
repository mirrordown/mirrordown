# Changelog








## 0.7.0
<sub>2026-11-24</sub>

- *(minor)*
  Add `tags`, on by default like every other feature: `#tag` in text becomes `<a class="tag" href="#tag">#tag</a>`. Pages rendered with a preset change where their text holds such a word.

  - **A word that starts with `#` is now a link.**

    ```markdown
    Set the colour to #fff and see #todo below.
    ```

    Was plain text. Now `#fff` and `#todo` are tag links. A hash followed only by digits (`#1984`, `#000`), one inside a word (`abc#def`), and one in code or in a link are still text. Write `\#fff` to keep a single word as text, or pass `tags: false` to turn the feature off.

  - **`tags: { href }` sets where a tag links to,** for a site with tag pages: `mirrordown({ tags: { href: (name) => "/tags/" + name } })`.
- *(minor)*
  Highlights take variants from a marker emoji, the presets' stylesheets include the mark set's new one, and `mark` takes options.

  - **A highlight that starts with a marker emoji is a coloured pill.**

    ```markdown
    ==🔴Important== ==🐛 Bug==
    ```

    Was `<mark>🔴Important</mark>` and `<mark>🐛 Bug</mark>`. Now `<mark data-highlight="red">Important</mark>` and `<mark data-highlight="bug">🐛 Bug</mark>`, each drawn as a pill by the preset's stylesheet. The colour emoji 🔴🟠🟡🟢🔵🟣 and the squares 🟥🟧🟨🟩🟦🟪 are removed; the label emoji 🐛 📖 ✨ ❓ 🙋 🌱 👯 🚫 ⛔ ⚠️ are kept. Put any character before the emoji, or a backslash before the opening `==`, to keep a plain highlight.

  - **`mark` takes the plugin's options**, as well as `true` and `false`: `mirrordown({ mark: { markers: { "🚀": "release", "🟡": false } } })` adds a marker and turns one off.
- *(minor)*
  Add `imageSize`, on by default like every other feature: an image's description can end in a size, as in Obsidian. Pages rendered with a preset change where an image's description ends that way.

  - **`![alt|100x145](…)` and `![alt|100](…)` size the image.**

    ```markdown
    ![Engelbart|100x145](engelbart.jpg)
    ```

    Was `<img src="engelbart.jpg" alt="Engelbart|100x145">`. Now `<img src="engelbart.jpg" alt="Engelbart" width="100" height="145">`.

  - **A description that is only a number is a width.**

    ```markdown
    ![2024](chart.png)
    ```

    Was `<img src="chart.png" alt="2024">`. Now `<img src="chart.png" alt="" width="2024">`. Write more than the number (`![Chart for 2024](chart.png)`), or pass `imageSize: false`.
- *(minor)*
  Add `taskLists`, on by default like every other feature, and its stylesheet to each preset's `styles.css`. Pages rendered with a preset change where a list item starts with a box.

  - **The markdown-it preset renders GFM's task lists**, as the remark and Sätteri presets already did.

    ```markdown
    - [x] done
    ```

    Was `<ul><li>[x] done</li></ul>`. Now `<ul class="contains-task-list"><li class="task-list-item"><input type="checkbox" checked disabled> done</li></ul>`, the same HTML as the other two presets.

  - **Six more markers are tasks in every preset**: `/` in progress, `-` cancelled, `>` forwarded, `<` scheduled, `?` question, `!` important.

    ```markdown
    - [?] which licence
    ```

    Was `<ul><li>[?] which licence</li></ul>`. Now `<ul class="contains-task-list"><li class="task-list-item" data-task="?"><input type="checkbox" disabled aria-label="Question"> which licence</li></ul>`, drawn with an icon by the preset's stylesheet. The box is not checked: only `x` is a done task.

  - **Any other marker is unchanged.** `- [b] text` and `- [1] reference` stay text.

  - **`taskLists` takes the plugin's options**, as well as `true` and `false`: `mirrordown({ taskLists: { markers: { b: "Bookmark" }, fallback: true } })` adds a marker and reads any single character as a task, as Obsidian does. `taskLists: false` leaves the markdown-it preset without task lists and the other two with GFM's.
- *(minor)*
  Add `blockIds`, on by default like every other feature. Pages rendered with a preset change where a block ends in a space and `^name`.

  - **A block identifier becomes the block's `id`.**

    ```markdown
    The quick purple gem dashes through the paragraph. ^37066d
    ```

    Was `<p>The quick purple gem dashes through the paragraph. ^37066d</p>`. Now `<p id="^37066d">The quick purple gem dashes through the paragraph.</p>`.

  - **A heading that ends in a marker takes the marker's id instead of a slug.**

    ```markdown
    ## Setup ^setup
    ```

    Was `<h2 id="setup-setup">Setup ^setup</h2>`. Now `<h2 id="^setup">Setup</h2>`, and its anchor link points at `#^setup`.

  - **A paragraph that is only a marker is removed**, naming the block before it when there is one.

    ```markdown
    | a |
    | - |
    | b |

    ^results
    ```

    Was a table and `<p>^results</p>`. Now `<table id="^results">…</table>`.

  - **Text that happens to end this way changes too.** `Stop it with ^C` was `<p>Stop it with ^C</p>` and is now `<p id="^C">Stop it with</p>`. Write the key as code, or pass `blockIds: false`.

## 0.6.1
<sub>2026-11-17</sub>

- *(patch)*
  The remark and Sätteri presets now list their plugins in the order markdown-it applies them (ruby first, kbd before del and ins, alerts after the inline plugins and after steps and tabs, abbr after alerts and attrs), which fixes the cases below; the markdown-it preset renders as before.

  - **Marks in an alert's title are formatted, and its label is the title's text** (remark, Sätteri).

    ```markdown
    > [!NOTE] Press [[Ctrl]] ==m== ++i++
    > body
    ```

    Was, in remark, the title left as the text `Press [[Ctrl]] ==m== ++i++`; in Sätteri the title was formatted but its `aria-label` still read `Press [[Ctrl]] ==m== ++i++`. Now the title `Press <kbd>Ctrl</kbd> <mark>m</mark> <ins>i</ins>` with `aria-label="Press Ctrl m i"`, as in markdown-it.

  - **The inline plugins apply inside a ruby** (remark).

    ```markdown
    {==漢字==|かんじ}
    ```

    Was `<ruby>==漢字==<rt>かんじ</rt></ruby>`. Now `<ruby><mark>漢字</mark><rt>かんじ</rt></ruby>`, as in markdown-it and Sätteri. The same goes for a reading (`{a|--c-- [[K]]}`), for an abbreviation in a base or a reading, and for a ruby in an alert's title, which rendered as `<ruby>{漢字|かんじ}</ruby>`.

  - **A key's brackets keep the delimiters inside it from pairing with ones outside** (remark, Sätteri).

    ```markdown
    --[[a--]]--
    ```

    Was `<del>[[a</del>]]--`. Now `<del><kbd>a--</kbd></del>`, as in markdown-it. The same goes for `++`: `++[[a++]]++` is an inserted key.

  - **An abbreviation equal to an alert's keyword leaves the alert an alert** (remark, Sätteri).

    ```markdown
    *[NOTE]: A note abbr

    > [!NOTE]
    > body NOTE
    ```

    Was a plain blockquote starting `[!<abbr title="A note abbr">NOTE</abbr>]`. Now a note alert whose body reads `body <abbr title="A note abbr">NOTE</abbr>`, as in markdown-it.

  - **A term inside an attribute block is part of the block** (remark).

    ```markdown
    *[HTML]: Hyper Text

    Text HTML {.HTML}
    ```

    Was the block left as text with the term wrapped inside it: `Text <abbr …>HTML</abbr> {.<abbr …>HTML</abbr>}`. Now `<p class="HTML">Text <abbr title="Hyper Text">HTML</abbr></p>`, as in markdown-it and Sätteri. A heading such as `## HTML {#HTML}` gets its id the same way.

  - **An abbreviation's definition is read even when its title holds a ruby** (remark, Sätteri).

    ```markdown
    *[a]: Hyper {x|y}

    a z
    ```

    Was the definition printed as a paragraph, `*[a]: Hyper <ruby>x<rt>y</rt></ruby>`, and `a` left alone. Now `<abbr title="Hyper {x|y}">a</abbr> z`, as in markdown-it.

  - **An alert marker directly under a step or tab header is the first line of the body** (remark, Sätteri).

    ```markdown
    @1. Step
    > [!TIP]
    > A tip.
    ```

    Was a step without a body, followed by a tip alert. Now the step's body `<p>[!TIP]\nA tip.</p>`, as in markdown-it. Under a tab header (`% Demo`) the marker line was dropped from the panel in remark and the alert followed the tabs in Sätteri; it is now the panel's first line. Write an alert inside a body as a nested quote (`> > [!TIP]`).

  - **tab-icons follows the tabs plugin's `containerClass`** (remark, Sätteri). With `tabs: { containerClass: "my-tabs" }`, no label got an icon and a `[!yarn]` marker stayed in its label; icons and markers now work as with the default class. A `containerClass` given to `tabIcons` itself still wins. The markdown-it preset passes the class on as well, so it keeps rendering icons now that the markdown-it tab-icons plugin honours the option.

  The READMEs now list every option the presets take (`copyCode`, `fileTree`, `prompt` and `tabIcons` were missing) and say which GFM features the markdown-it preset does not have: footnotes, task lists and bare URLs.

## 0.6.0
<sub>2026-11-11</sub>

- *(minor)*
  Require Sätteri 0.11.3 or later, which Astro ships from 7.4.7 (`@astrojs/markdown-satteri` 0.4.7). The plugins now read the document's features from Sätteri itself, so in Astro `satteriRuby()` needs no `features` passed to it, and tabs and steps no longer allow for a Sätteri that passes none. On Astro 7.4.6 or earlier, update Astro first.

## 0.5.0
<sub>2026-11-03</sub>

- *(minor)*
  Add `fileTree`, on by default like every other feature: ` ```filetree ` fences render as file trees, and an options object passes a theme or icons to the plugin. The presets' stylesheets include its styles. Hosts that highlight code first, such as Astro with Shiki, need `filetree` in their excluded languages, as with `mermaid`.
- *(minor)*
  Add `prompt`, on by default like every other feature: ` ```prompt ` fences render as AI prompts to copy or open in AI services, and an options object passes services, text or a highlighter to the plugin. The presets' stylesheets include its styles. Hosts that highlight code first, such as Astro with Shiki, should alias `prompt` to `markdown` and keep each fence's meta on its `<pre>`.

## 0.4.0
<sub>2026-11-02</sub>

- *(minor)*
  Add `copyCode`, on by default like every other feature: every code block gets a copy button, shown once the page loads the plugin's client script. An options object sets the button's icons and text. The presets' stylesheets include its styles.

## 0.3.0
<sub>2026-10-28</sub>

- *(minor)*
  Add `tabIcons`, on by default like every other feature: tab labels get the icon their text matches or a `[!keyword]` marker names. The presets' stylesheets include its styles.

## 0.2.0
<sub>2026-10-28</sub>

- *(minor)*
  Add `mermaidPele`, on by default like every other feature: ` ```mermaid ` code blocks render to inline SVG with Pele, and the presets' stylesheets include its theme. With remark, stringify with `allowDangerousHtml: true` (Astro already does); in Astro, leave `mermaid` out of highlighting with `syntaxHighlight: { type: "shiki", excludeLangs: ["mermaid"] }`, since Astro highlights code blocks before the plugins run.
- *(minor)*
  Add `caption`, on by default like every other feature: a `~:` line right after a block captions it, wrapping the block in a `<figure>`. The presets' stylesheets include its styles.
- *(patch)*
  Captioned lightbox images: a lightbox image (`!![alt](src)`) followed by a `~:` caption is now the figure's content, so its trigger sits directly in the `<figure>` without unwrap-images. The lightbox plugins take a `caption` option (off by default) that shows a captioned image's caption under it in the dialog; repeated images share one dialog, which shows the first caption any of them has. The presets pass lightbox options through (`lightbox: { caption: true }`). The lightbox READMEs are now generated from its guide.

## 0.1.0
<sub>2026-10-28</sub>

- *(minor)*
  First Sätteri plugins, for Astro 7's default markdown processor, rendering the same HTML as the markdown-it and remark plugins:

  - `@mirrordown/sat-slug`: heading ids, shared slugging with `mdit-slug` and `remd-slug`.
  - `@mirrordown/sat-github-alerts`: GitHub-style alerts, with the alert logic shared through `@mirrordown/core`, and the same stylesheet as the other engines.
  - `@mirrordown/sat-mark`: `==highlight==`, using the same scan as `remd-mark` from `@mirrordown/core`.
  - `@mirrordown/preset-satteri`: the Sätteri suite in one call, `markdownToHtml(source, mirrordown())` or Astro's `satteri(mirrordown())`, with Sätteri's built-in subscript and superscript turned on and smart punctuation off.
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
  New `@mirrordown/sat-ruby`: ruby annotations (`{base|reading}`) for Sätteri, with the same output as `remd-ruby` and `mdit-ruby`, and no parser changes. It finds rubies in each block's source and re-parses the content around them with each ruby held as a placeholder, so `|` stays a hard delimiter (the base and reading are parsed on their own) and constructs around a ruby wrap it whole. Pass it the document's `features`. In `@mirrordown/preset-satteri` it runs first among the mdast plugins and gets the preset's features.
- *(minor)*
  New `@mirrordown/sat-abbr`: abbreviations (`*[term]: definition`) for Sätteri, with the same output as `remd-abbr` and `mdit-abbr`, and included in `@mirrordown/preset-satteri`. The definition and term rules move into `@mirrordown/core` (`parseAbbreviations`, `createAbbreviationScan`), which `remd-abbr` now uses too; its output is unchanged.
- *(minor)*
  New `@mirrordown/sat-steps`: numbered step sequences (`@1. Title` with `>` bodies) for Sätteri, with the same output as `remd-steps` and `mdit-steps`, and included in `@mirrordown/preset-satteri` along with its stylesheet. Step recognition moves into `@mirrordown/core` (`processSteps`), which `remd-steps` now uses too; its output is unchanged.
- *(minor)*
  New `@mirrordown/sat-tabs`: tabbed content blocks (`% Label` with `>` bodies) for Sätteri, with the same output as `remd-tabs` and `mdit-tabs`, and included in `@mirrordown/preset-satteri` along with its stylesheet. Recognition is shared with `remd-tabs` through `@mirrordown/core`. A panel's `aria-label` is its label's text when tabs renders, so list `satteriTabs()` after the plugins for inline syntax (the preset does).
- *(minor)*
  Sätteri 0.11 reads attribute blocks and definition lists the way Mirrordown's other engines do, so the Sätteri suite now covers every feature:

  - `preset-satteri` has `attrs` and `definitionList` options, on by default like the other presets, which turn on Sätteri's own `attributes` and `definitionList` features. With them, the preset renders every shared fixture as `preset-remark` and `preset-markdown-it` do.
  - The `sat-*` packages accept Sätteri 0.11 as well as 0.10 (`^0.10.5 || ^0.11.0`); Astro's Sätteri integration is still on 0.10, where the plugins work as before.
  - An attribute block ending a tab or step header (`% Tab {.tab}`, `@1. Step {.step}`) now goes on the item in `sat-tabs` and `sat-steps`, as in the other engines: Sätteri read it off the header's paragraph before recognition, and the item didn't get it.
  - `sat-ruby` parses a ruby's base and reading with the document's features, which Sätteri 0.11.3 and later tell plugins; its `features` option is only needed with an older Sätteri.
- *(patch)*
  New `@mirrordown/sat-inline-svg`: inlines referenced local `.svg` images as `<svg>` elements in Sätteri, resolving them against the `fileURL` compile option, with the same output as `mdit-inline-svg` and `remd-inline-svg`. The size limits, deduplication and markup move into `@mirrordown/core` (`inlineSvgMarkup`, `svgSpriteId`), which the markdown-it and rehype plugins now use too; their output is unchanged. Like the other presets, `@mirrordown/preset-satteri` leaves it out because it reads files from disk.
