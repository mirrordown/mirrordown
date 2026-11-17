# Changelog



## 0.2.1
<sub>2026-11-17</sub>

- *(patch)*
  Fixes for heading ids that could repeat, and for two places where markdown-it gave a heading a different id than remark and Sätteri.

  - **A generated id never repeats an id written by hand** (all engines).

    ```markdown
    ## B {#b}

    ## B
    ```

    Was `id="b"` on both headings. Now `id="b"` and `id="b-1"`. The hand-written ids are collected first, so the order of the headings doesn't matter, and the `prefix` option is taken into account.

  - **An empty id counts as no id** (markdown-it).

    ```markdown
    ## E {id=""}
    ```

    Was `<h2 id="">`. Now `<h2 id="e">`, as in remark and Sätteri.

  - **The id is built from all the text a heading shows** (markdown-it). Text that another plugin renders from its own syntax was left out. With the ruby plugin's `rp` set to `["open", "close"]`:

    ```markdown
    ## {漢字|kanji} ruby
    ```

    Was `id="漢字kanji-ruby"`. Now `id="漢字openkanjiclose-ruby"`, as in remark and Sätteri. With the usual `(` and `)` the id is unchanged.

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
