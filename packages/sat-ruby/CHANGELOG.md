# Changelog



## 0.2.1
<sub>2026-11-17</sub>

- *(patch)*
  Fixes for edge cases where the three engines read `{base|reading}` differently. Most are in markdown-it, which matched too much, and in Sätteri, which lost text and attributes around a ruby.

  - **A ruby stays on one line and inside one pair of braces** (markdown-it).

    ```markdown
    Use {name} as a placeholder.
    Then a | b or {x}.
    ```

    Was one ruby from `{name` to `x}`, with `name} as a placeholder. Then a` as its base. Now the text as written, as in remark and Sätteri.

  - **An attribute block before a ruby is no longer swallowed by it** (markdown-it, with the attrs plugin).

    ```markdown
    *a*{.x} and {漢字|かんじ} here
    ```

    Was `<em>a</em><ruby>.x} and {漢字<rt>かんじ</rt></ruby> here`. Now `<em class="x">a</em> and <ruby>漢字<rt>かんじ</rt></ruby> here`, as in remark.

  - **The space between a ruby and the element beside it is kept** (Sätteri).

    ```markdown
    *x* {a|b}
    ```

    Was `<em>x</em><ruby>a<rt>b</rt></ruby>`. Now `<em>x</em> <ruby>a<rt>b</rt></ruby>`.

  - **An attribute block written right after a ruby goes on the `<ruby>`** (Sätteri, with its `attributes` feature on).

    ```markdown
    {漢字|かんじ}{.x}
    ```

    Was `<p class="x"><ruby>…</ruby></p>`, and mid-paragraph the block stayed on the page as text. Now `<p><ruby class="x">…</ruby></p>`, as in markdown-it and remark.

  - **Attributes on an element that holds or follows a ruby are kept** (Sätteri, with its `attributes` feature on).

    ```markdown
    *{漢字|かんじ}*{.x}
    ```

    Was `<em><ruby>…</ruby></em>`, the class lost. Now `<em class="x"><ruby>…</ruby></em>`. A block with no element to go on, as in `{a|b} word{.r} *em*`, used to vanish from the page and now stays as text, as in the other engines.

  - **Spaces and tabs around the base and the reading are dropped** (all engines).

    ```markdown
    { a | b }
    ```

    Was `<ruby> a <rt> b </rt></ruby>` in markdown-it. Now `<ruby>a<rt>b</rt></ruby>`, as in remark and Sätteri. A base indented four or more spaces, `{    a|b}`, kept its spaces in every engine and no longer does.

  - **Emphasis markers directly against a ruby inside a word stay text** (Sätteri). This changes documents that relied on it.

    ```markdown
    これは**{漢字|かんじ}**です
    ```

    Was `これは<strong><ruby>…</ruby></strong>です`. Now `これは**<ruby>…</ruby>**です`, as in markdown-it and remark, where a brace is punctuation to the asterisks beside it.

  - **A reference link in a base or a reading resolves** (remark, Sätteri).

    ```markdown
    {[foo]|bar}

    [foo]: /url
    ```

    Was `<ruby>[foo]<rt>bar</rt></ruby>`. Now `<ruby><a href="/url">foo</a><rt>bar</rt></ruby>`, as in markdown-it. Image and footnote references resolve too.

  - **An escaped delimiter after a ruby stays text** (Sätteri, with a span plugin such as mark).

    ```markdown
    {漢字|かんじ} \==b==
    ```

    Was `<ruby>…</ruby> <mark>b</mark>`. Now `<ruby>…</ruby> ==b==`.

  - **An indented continuation line that starts like a block keeps its text** (Sätteri).

    ```markdown
    a
        - b {x|y}
    ```

    Was `<p>a</p>`: the rest of the paragraph, ruby included, was dropped. Now `a` and `- b <ruby>x<rt>y</rt></ruby>` in one paragraph. A line starting with `>` used to lose the `>`.

  - **A backslash before the bar is removed only in a table cell** (remark, Sätteri).

    ```markdown
    {a\|b}
    ```

    Was `<ruby>a<rt>b</rt></ruby>`. Now `<ruby>a\<rt>b</rt></ruby>`, as in markdown-it. In a table cell, where the bar has to be escaped, the backslash is still removed.

  - **A ruby holding a `]` works inside a link's text** (markdown-it).

    ```markdown
    [{a|b]c}](/url)
    ```

    Was no link: `[<ruby>a<rt>b]c</rt></ruby>](/url)`. Now `<a href="/url"><ruby>a<rt>b]c</rt></ruby></a>`, as in remark and Sätteri.

  - **A base or a reading that opens with an HTML tag is inline HTML** (remark, Sätteri, with raw HTML allowed).

    ```markdown
    {<b>|x}
    ```

    Was the tag escaped and shown as text. Now `<ruby><b><rt>x</rt></ruby>`, as in markdown-it.

  - **An `rp` that is not a pair of strings is refused** (all engines). `rp: ["("]` used to print `<rp>undefined</rp>` in markdown-it and remark and no `<rp>` at all in Sätteri; it now throws a `TypeError`.

  - **Running the remark transformer twice on one tree no longer throws** (remark).

  - **Private Use characters you typed are never taken for the plugin's own placeholders** (Sätteri). Such a character before a digit could be replaced by a copy of a ruby, or deleted.

  `@mirrordown/sat-ruby` now depends on `@mirrordown/core`. The guide now says where Sätteri still differs.

## 0.2.0
<sub>2026-11-11</sub>

- *(minor)*
  Require Sätteri 0.11.3 or later, which Astro ships from 7.4.7 (`@astrojs/markdown-satteri` 0.4.7). The plugins now read the document's features from Sätteri itself, so in Astro `satteriRuby()` needs no `features` passed to it, and tabs and steps no longer allow for a Sätteri that passes none. On Astro 7.4.6 or earlier, update Astro first.

## 0.1.0
<sub>2026-10-28</sub>

- *(minor)*
  New `@mirrordown/sat-ruby`: ruby annotations (`{base|reading}`) for Sätteri, with the same output as `remd-ruby` and `mdit-ruby`, and no parser changes. It finds rubies in each block's source and re-parses the content around them with each ruby held as a placeholder, so `|` stays a hard delimiter (the base and reading are parsed on their own) and constructs around a ruby wrap it whole. Pass it the document's `features`. In `@mirrordown/preset-satteri` it runs first among the mdast plugins and gets the preset's features.
- *(patch)*
  Sätteri 0.11 reads attribute blocks and definition lists the way Mirrordown's other engines do, so the Sätteri suite now covers every feature:

  - `preset-satteri` has `attrs` and `definitionList` options, on by default like the other presets, which turn on Sätteri's own `attributes` and `definitionList` features. With them, the preset renders every shared fixture as `preset-remark` and `preset-markdown-it` do.
  - The `sat-*` packages accept Sätteri 0.11 as well as 0.10 (`^0.10.5 || ^0.11.0`); Astro's Sätteri integration is still on 0.10, where the plugins work as before.
  - An attribute block ending a tab or step header (`% Tab {.tab}`, `@1. Step {.step}`) now goes on the item in `sat-tabs` and `sat-steps`, as in the other engines: Sätteri read it off the header's paragraph before recognition, and the item didn't get it.
  - `sat-ruby` parses a ruby's base and reading with the document's features, which Sätteri 0.11.3 and later tell plugins; its `features` option is only needed with an older Sätteri.
