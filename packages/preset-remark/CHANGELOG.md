# Changelog








## 0.7.0
<sub>2026-11-26</sub>

- *(minor)*
  New plugin set `cjk-breaks`: a line break inside Chinese or Japanese text is no longer a space on the page. The presets turn it on by default.

  - **New: `@mirrordown/mdit-cjk-breaks`, `@mirrordown/remd-cjk-breaks`, `@mirrordown/sat-cjk-breaks`.** Authors wrap long paragraphs in their editor, and a browser shows each line break as a space: right between Latin words, wrong in the middle of a sentence written without spaces. The plugins remove a soft line break when the characters on both sides have East Asian Width W, F or H and neither is Hangul, or when either is the zero-width space U+200B.

    ```markdown
    吾輩は猫である。
    名前はまだ無い。
    ```

    Was `<p>吾輩は猫である。⏎名前はまだ無い。</p>`, which a browser shows as `吾輩は猫である。 名前はまだ無い。`. Now `<p>吾輩は猫である。名前はまだ無い。</p>`.

    Korean, which puts spaces between words, keeps its breaks, and so does a break with a Latin word on either side:

    ```markdown
    한국어 문장은
    띄어쓰기를 합니다.

    日本語
    English
    ```

    Both render as before.

  - **The character on each side is the one the reader sees.** Emphasis, links and the Mirrordown spans are read through, and a code span counts by its own content. An image, raw HTML or a hard break is not a character, so the break beside it stays.

    ```markdown
    **日本**
    **語**

    日本語`foo`
    日本語
    ```

    Now `<p><strong>日本</strong><strong>語</strong></p>` and, unchanged, `<p>日本語<code>foo</code>⏎日本語</p>`. This differs from `markdown-it-cjk-breaks`, which looks for the nearest text on each side and steps over what lies between: it removes the second break, joining `foo` to `日本語`.

  - **Presets: `cjkBreaks`, on by default.** All three presets remove CJK breaks, after every plugin that reads lines, so tabs, steps, alerts, captions and the rest find their syntax first. A document with no soft break between two wide characters renders byte for byte as before. Turn it off with `cjkBreaks: false`.

  - **`@mirrordown/core`** exports `cjkBreakRemoved`, the rule the three plugins share, and `removeCjkBreaks`, the mdast transform behind the remark and Sätteri plugins.
- *(minor)*
  New plugin set `cjk-friendly` for markdown-it and remark: emphasis and every other delimiter open and close beside Chinese, Japanese and Korean punctuation. The two presets turn it on by default. Sätteri resolves emphasis in its parser and does not have the rule yet.

  - **New: `@mirrordown/mdit-cjk-friendly` and `@mirrordown/remd-cjk-friendly`.** CommonMark decides whether `**` can open or close by the characters around it, with rules written for languages that put spaces between words. Beside CJK punctuation they fail. The plugins implement the [CommonMark CJK-friendly Amendments](https://github.com/tats-u/markdown-cjk-friendly/blob/main/specification.md).

    ```markdown
    **テスト。**テスト

    これは**「重要」**です

    **이름(Name)**은 필수입니다
    ```

    Was `<p>**テスト。**テスト</p>`, `<p>これは**「重要」**です</p>` and `<p>**이름(Name)**은 필수입니다</p>`. Now `<p><strong>テスト。</strong>テスト</p>`, `<p>これは<strong>「重要」</strong>です</p>` and `<p><strong>이름(Name)</strong>은 필수입니다</p>`.

  - **Strikethrough and the Mirrordown delimiters take the same rule.** `~~`, `==`, `++`, `--`, `||`, `~` and `^` are flanked as emphasis is, so they failed in the same places.

    ```markdown
    ~~削除。~~テスト

    これは==「重要」==です
    ```

    Was text in both. Now `<p><del>削除。</del>テスト</p>` (`<s>` in markdown-it) and `<p>これは<mark>「重要」</mark>です</p>`. In remark, `remd-mark`, `remd-ins`, `remd-del`, `remd-spoiler`, `remd-sub` and `remd-sup` read whether `remarkCjkFriendly` is in the processor, in any plugin order; without it they render as before.

  - **Text without CJK characters is unchanged**, with one exception the specification makes on purpose: punctuation followed by a variation selector is read as punctuation.

    ```markdown
    a**"b"**c

    **a.**b
    ```

    Both stay text, as in CommonMark.

  - **Presets: `cjkFriendly`, on by default** in `@mirrordown/preset-markdown-it` and `@mirrordown/preset-remark`. Turn it off with `cjkFriendly: false`. `@mirrordown/preset-satteri` has no such option yet.

  - **`@mirrordown/core`** decides every delimiter's flanking in one function, `delimiterFlanking`, with the amendment as an option. `createDelimitedTransform` and `scriptSyntax` take an optional reader that says whether it is on.

## 0.6.0
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

## 0.5.1
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
  New presets for adopting the whole suite in one call: `@mirrordown/preset-markdown-it` (`md.use(mirrordown, options)`) and `@mirrordown/preset-remark` (`mirrordown(options)`, which plugs into Astro's `unified()` processor or a unified pipeline). Every feature is on by default, `false` turns one off, and an options object configures it. Each preset also ships a stylesheet that imports every plugin's CSS.

  `mdit-autolink-headings` no longer adds an anchor to a heading whose id is empty (a heading with no text, such as one holding only an image): there is nothing to link to, and `remd-autolink-headings` already skipped it.
- *(patch)*
  Attrs run after the other remark plugins, as `mdit-attrs` does in markdown-it, so attributes on a step title (`@1. Step {.cls}`) or a tab label (`% Tab {.cls}`) reach the step or tab instead of being dropped.
- *(patch)*
  `remd-github-alerts` applies other plugins' `data` to a blockquote that isn't an alert, as remark-rehype's own handler does, so attributes on a blockquote (`> quote` then `{.note}`) are no longer dropped when alerts are on.
