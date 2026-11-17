# Changelog



## 0.2.1
<sub>2026-11-17</sub>

- *(patch)*
  Fixes for edge cases where the three engines rendered `==highlighted==` text differently, or wrongly.

  - **An attribute block written right after a highlight goes on the `<mark>`** (Sätteri, with its `attributes` feature on).

    ```markdown
    ==a=={.x}
    ```

    Was `<p class="x"><mark>a</mark></p>`, and mid-paragraph the block stayed on the page as text. Now `<p><mark class="x">a</mark></p>`, as in markdown-it and remark.

  - **An escaped delimiter stays text after another plugin's span** (remark, Sätteri).

    ```markdown
    --a-- \==b==
    ```

    Was `<del>a</del> <mark>b</mark>`. Now `<del>a</del> ==b==`, as in markdown-it. The same holds after `++inserted++` text, a `[[key]]` and an abbreviation.

  - **An escape is still honoured after smart punctuation or an emoji reference** (remark, Sätteri). With Sätteri's smart punctuation on, `"q" \==a==` now keeps `==a==` as text.

    ```markdown
    &#x1F600; \==a==
    ```

    Was `😀 <mark>a</mark>`. Now `😀 ==a==`.

  - **An equals sign written as a character reference is not a delimiter** (remark, Sätteri).

    ```markdown
    &#61;=a==
    ```

    Was `<mark>a</mark>`. Now the text `==a==`.

  - **The text of an autolink is left alone** (remark, Sätteri).

    ```markdown
    <http://x.com/==a==>
    ```

    Was a link whose text read `http://x.com/<mark>a</mark>`. Now the link text is the URL as written.

  - **An escaped character or a character reference beside the equals signs counts as punctuation** (remark, Sätteri). This decides whether a pair of them can open or close.

    ```markdown
    \!==(a)==
    ```

    Was the text `!==(a)==`. Now `!<mark>(a)</mark>`, as in markdown-it.

  - **An abbreviation beside the equals signs is read as the word it is** (remark, Sätteri, with the abbr plugin).

    ```markdown
    *[HTML]: Hyper Text

    a==HTML==
    ```

    Now `a<mark><abbr title="Hyper Text">HTML</abbr></mark>`, as in markdown-it.

  - **A backslash line break right after the opening equals signs does not stop them from opening** (remark, Sätteri).

    ```markdown
    (==\
    a==
    ```

    Now `(<mark><br>a</mark>`, as in markdown-it.

  - **An emoji or other character outside the Basic Multilingual Plane beside the equals signs is read whole** (remark, Sätteri).

    ```markdown
    a==😀b==
    ```

    Now the text `a==😀b==`, as in markdown-it.

  - **Highlights nest up to 100 deep** (all engines). The markers of deeper ones stay text. Sätteri used to reject the whole document once spans nested deeper than 128, and remark could run out of stack on a few thousand levels.

  - **Private Use characters you typed are kept** (remark, Sätteri). Characters in the range U+F0021 to U+F007E, where some icon fonts put their glyphs, were rewritten to ASCII punctuation, in remark anywhere in the document, code blocks included.

  - **A long run of backslashes no longer slows the scan down** (remark, Sätteri). A line of them could take many seconds.

  The guide now lists the differences between engines that remain.

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
- *(minor)*
  `==mark==`, `++ins++` and `--del--` now pair delimiters the same way in every engine. `@mirrordown/core`'s `createDelimitedTransform` ports markdown-it's delimiter algorithm (the one markdown-it-mark and markdown-it-ins use), and the remark and Sätteri plugins run on it:

  - A closer pairs with the nearest opener: `==a ==b==` highlights only `b`, as markdown-it does.
  - Spans nest: `==a ==b== c==` is a highlight inside a highlight.
  - The extra marker of an odd-length run stays outside the span (`===a===` → `=<mark>a</mark>=`); `mdit-del` compared against `+` instead of `-` here, so its marker ended up inside.
  - `remd-del` no longer mishandles runs such as `--a --- b--` or `--+a+--`, which came from patterns copied from the ins plugin.

  New Sätteri plugins `@mirrordown/sat-ins` and `@mirrordown/sat-del`, also included in `@mirrordown/preset-satteri`. The `del` guide notes that smart punctuation, on by default in Astro, turns `--` into an en dash before the plugin runs.
- *(patch)*
  Sätteri 0.11 reads attribute blocks and definition lists the way Mirrordown's other engines do, so the Sätteri suite now covers every feature:

  - `preset-satteri` has `attrs` and `definitionList` options, on by default like the other presets, which turn on Sätteri's own `attributes` and `definitionList` features. With them, the preset renders every shared fixture as `preset-remark` and `preset-markdown-it` do.
  - The `sat-*` packages accept Sätteri 0.11 as well as 0.10 (`^0.10.5 || ^0.11.0`); Astro's Sätteri integration is still on 0.10, where the plugins work as before.
  - An attribute block ending a tab or step header (`% Tab {.tab}`, `@1. Step {.step}`) now goes on the item in `sat-tabs` and `sat-steps`, as in the other engines: Sätteri read it off the header's paragraph before recognition, and the item didn't get it.
  - `sat-ruby` parses a ruby's base and reading with the document's features, which Sätteri 0.11.3 and later tell plugins; its `features` option is only needed with an older Sätteri.
