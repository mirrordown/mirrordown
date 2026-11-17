# Changelog



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
<sub>2026-11-11</sub>

- *(minor)*
  Require Sätteri 0.11.3 or later, which Astro ships from 7.4.7 (`@astrojs/markdown-satteri` 0.4.7). The plugins now read the document's features from Sätteri itself, so in Astro `satteriRuby()` needs no `features` passed to it, and tabs and steps no longer allow for a Sätteri that passes none. On Astro 7.4.6 or earlier, update Astro first.

## 0.1.0
<sub>2026-10-28</sub>

- *(minor)*
  First Sätteri plugins, for Astro 7's default markdown processor, rendering the same HTML as the markdown-it and remark plugins:

  - `@mirrordown/sat-slug`: heading ids, shared slugging with `mdit-slug` and `remd-slug`.
  - `@mirrordown/sat-github-alerts`: GitHub-style alerts, with the alert logic shared through `@mirrordown/core`, and the same stylesheet as the other engines.
  - `@mirrordown/sat-mark`: `==highlight==`, using the same scan as `remd-mark` from `@mirrordown/core`.
  - `@mirrordown/preset-satteri`: the Sätteri suite in one call, `markdownToHtml(source, mirrordown())` or Astro's `satteri(mirrordown())`, with Sätteri's built-in subscript and superscript turned on and smart punctuation off.
- *(patch)*
  Sätteri 0.11 reads attribute blocks and definition lists the way Mirrordown's other engines do, so the Sätteri suite now covers every feature:

  - `preset-satteri` has `attrs` and `definitionList` options, on by default like the other presets, which turn on Sätteri's own `attributes` and `definitionList` features. With them, the preset renders every shared fixture as `preset-remark` and `preset-markdown-it` do.
  - The `sat-*` packages accept Sätteri 0.11 as well as 0.10 (`^0.10.5 || ^0.11.0`); Astro's Sätteri integration is still on 0.10, where the plugins work as before.
  - An attribute block ending a tab or step header (`% Tab {.tab}`, `@1. Step {.step}`) now goes on the item in `sat-tabs` and `sat-steps`, as in the other engines: Sätteri read it off the header's paragraph before recognition, and the item didn't get it.
  - `sat-ruby` parses a ruby's base and reading with the document's features, which Sätteri 0.11.3 and later tell plugins; its `features` option is only needed with an older Sätteri.
