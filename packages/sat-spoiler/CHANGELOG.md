# Changelog



## 0.2.1
<sub>2026-11-17</sub>

- *(patch)*
  Fixes for cases where a `||spoiler||` formed in one engine and not another, which either hides text you meant to show or shows text you meant to hide.

  - **Without `spoilerHastHandlers`, the remark plugin keeps the content covered** (remark). The handlers are still required for a spoiler that can be revealed; this is what happens when they are not passed to `remark-rehype`.

    ```markdown
    a ||b|| c
    ```

    Was `a <div>b</div> c`, the content in the clear. Now `a <span class="markdown-spoiler-content">b</span> c`, which the stylesheet covers and nothing reveals.

  - **A spoiler in a table cell forms** (remark, Sätteri). In a cell the pipes have to be written `\|`.

    ```markdown
    | h |
    | - |
    | \|\|x\|\| |
    ```

    Was the text `||x||` in the cell. Now a spoiler, as in markdown-it.

  - **An attribute block written right after a spoiler is read and dropped** (Sätteri, with its `attributes` feature on).

    ```markdown
    ||secret||{.danger}
    ```

    Was `<p class="danger">` around the spoiler, and mid-paragraph the block stayed on the page as text. Now the paragraph has no class and the block is gone, as in markdown-it and remark.

  - **Escaped pipes stay text after another plugin's span** (remark, Sätteri).

    ```markdown
    ==a== \||b||
    ```

    Was a spoiler around `b`. Now `<mark>a</mark> ||b||`, as in markdown-it.

  - **An escape is still honoured after smart punctuation** (Sätteri, with smart punctuation on).

    ```markdown
    "q" \||a||
    ```

    Was a spoiler around `a`. Now `“q” ||a||`.

  - **A pipe written as a character reference is not a delimiter** (remark, Sätteri).

    ```markdown
    &#124;&#124;text||
    ```

    Was a spoiler around `text`. Now the text `||text||`.

  - **The text of an autolink is left alone** (remark, Sätteri).

    ```markdown
    <http://x/||b||>
    ```

    Was a link with a spoiler around `b` in its text. Now the link text is the URL as written.

  - **An escaped character or a character reference beside the pipes counts as punctuation** (remark, Sätteri). This decides whether a pair of pipes can open or close.

    ```markdown
    a||\*b||
    ```

    Was `a` and a spoiler around `*b`. Now the text `a||*b||`, as in markdown-it.

  - **A backslash line break right after the opening pipes does not stop them from opening** (remark, Sätteri).

    ```markdown
    (||\
    a||
    ```

    Now a spoiler around the line break and `a`, as in markdown-it.

  - **Spoilers nest up to 50 deep** (all engines). The pipes of deeper ones stay text. Sätteri used to reject the whole document when spoilers nested too deep: each one counts twice toward its limit of 128 levels.

  The guide now lists the differences between engines that remain.

## 0.2.0
<sub>2026-11-11</sub>

- *(minor)*
  Require Sätteri 0.11.3 or later, which Astro ships from 7.4.7 (`@astrojs/markdown-satteri` 0.4.7). The plugins now read the document's features from Sätteri itself, so in Astro `satteriRuby()` needs no `features` passed to it, and tabs and steps no longer allow for a Sätteri that passes none. On Astro 7.4.6 or earlier, update Astro first.

## 0.1.0
<sub>2026-10-28</sub>

- *(minor)*
  `||spoiler||` now pairs delimiters with markdown-it's rules in every engine: `remd-spoiler` runs on `@mirrordown/core`'s delimiter scan (which gains the `|` marker), so a closer pairs with the nearest opener, spoilers nest, and an odd-length run's extra `|` stays outside; it drops its `unist-util-find-*` and `unist-builder` dependencies.

  New `@mirrordown/sat-spoiler` renders the same JavaScript-free click-to-reveal markup, ships the same stylesheet, and is included in `@mirrordown/preset-satteri`.
- *(patch)*
  Sätteri 0.11 reads attribute blocks and definition lists the way Mirrordown's other engines do, so the Sätteri suite now covers every feature:

  - `preset-satteri` has `attrs` and `definitionList` options, on by default like the other presets, which turn on Sätteri's own `attributes` and `definitionList` features. With them, the preset renders every shared fixture as `preset-remark` and `preset-markdown-it` do.
  - The `sat-*` packages accept Sätteri 0.11 as well as 0.10 (`^0.10.5 || ^0.11.0`); Astro's Sätteri integration is still on 0.10, where the plugins work as before.
  - An attribute block ending a tab or step header (`% Tab {.tab}`, `@1. Step {.step}`) now goes on the item in `sat-tabs` and `sat-steps`, as in the other engines: Sätteri read it off the header's paragraph before recognition, and the item didn't get it.
  - `sat-ruby` parses a ruby's base and reading with the document's features, which Sätteri 0.11.3 and later tell plugins; its `features` option is only needed with an older Sätteri.
