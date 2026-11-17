# Changelog



## 0.2.1
<sub>2026-11-17</sub>

- *(patch)*
  Fixes that make remark and Sätteri find definitions and terms by the rules markdown-it uses, plus a hang in markdown-it. Several change what existing documents render in remark and Sätteri: which words a term matches, and what a title holds.

  - **A term that starts or ends with a symbol or a non-ASCII letter is marked** (remark, Sätteri).

    ```markdown
    *[C++]: See plus plus
    *[.NET]: dot net

    Use C++ and .NET daily.
    ```

    Was plain text, no `<abbr>`. Now both terms are marked, as in markdown-it. The same goes for terms such as `日本` and `café`.

  - **A definition whose title or term holds inline syntax is read** (remark, Sätteri).

    ```markdown
    *[HTML]: Hyper *Text* Markup

    HTML
    ```

    Was the definition printed on the page (`*[HTML]: Hyper <em>Text</em> Markup`) and `HTML` left unmarked. Now `<abbr title="Hyper *Text* Markup">HTML</abbr>`, as in markdown-it. The same goes for a title holding a URL, code or raw HTML, a term such as `a*b`, and two definitions separated by a hard line break.

  - **A term directly against a letter of another script, a tab or a symbol such as `™` is no longer marked** (remark, Sätteri).

    ```markdown
    *[HTML]: Hyper

    これはHTMLです
    ```

    Was `これは<abbr title="Hyper">HTML</abbr>です`. Now no `<abbr>`, as in markdown-it. `HTML™` and `HTMLé` are no longer marked either, and an underscore now counts as a boundary: `foo_HTML` is marked.

  - **A title is the rest of the line as written** (remark, Sätteri).

    ```markdown
    *[RD]: Research &amp; Development

    RD
    ```

    Was a title reading `Research & Development`. Now the title reads `Research &amp; Development`, as in markdown-it: character references and backslash escapes in a title are not decoded.

  - **An escaped delimiter after an abbreviation stays text** (remark, Sätteri, with a span plugin such as mark).

    ```markdown
    *[HTML]: Hyper Text

    HTML \==a==
    ```

    Was `<abbr title="Hyper Text">HTML</abbr> <mark>a</mark>`. Now `<abbr title="Hyper Text">HTML</abbr> ==a==`, as in markdown-it.

  - **The space around a term and a title is dropped, and a blank term or title is no definition** (all engines).

    ```markdown
    *[ HTML ]: t

    x HTML y
    ```

    Was no `<abbr>` in markdown-it, and `x<abbr title="t"> HTML </abbr>y` in remark and Sätteri. Now `x <abbr title="t">HTML</abbr> y` in all three. `*[ ]: x` used to mark single spaces; it is now ordinary text.

  - **Definitions on CRLF lines are read** (remark, Sätteri). A paragraph of two or more definitions saved with Windows line endings was printed instead of read.

  - **A term written with an escape or a character reference is found, and one does not act as a word boundary** (markdown-it).

    ```markdown
    *[AT&T]: telco

    AT&amp;T
    ```

    Was no `<abbr>`. Now `<abbr title="telco">AT&amp;T</abbr>`, as in remark and Sätteri. In the other direction, with `HTML` defined, `HTML&#65;` renders `HTMLA` and is no longer marked.

  - **An escaped asterisk does not start a definition** (remark, Sätteri).

    ```markdown
    \*[X]: t
    ```

    Was a definition. Now the text `*[X]: t`, as in markdown-it.

  - **A definition named after a built-in object property no longer hangs the render** (markdown-it).

    ```markdown
    *[_proto__]: x

    (see) this
    ```

    Was an endless loop until memory ran out. Now `<p>(see) this</p>`.

  - **A line that is not a valid definition does not split the paragraph it is in** (markdown-it).

    ```markdown
    foo
    *[X]:
    bar
    ```

    Was two paragraphs, the second starting at `*[X]:`. Now one paragraph, as in remark and Sätteri.

  The guide now says what a definition is and where a term is marked, and lists the differences between engines that remain.

## 0.2.0
<sub>2026-11-11</sub>

- *(minor)*
  Require Sätteri 0.11.3 or later, which Astro ships from 7.4.7 (`@astrojs/markdown-satteri` 0.4.7). The plugins now read the document's features from Sätteri itself, so in Astro `satteriRuby()` needs no `features` passed to it, and tabs and steps no longer allow for a Sätteri that passes none. On Astro 7.4.6 or earlier, update Astro first.

## 0.1.0
<sub>2026-10-28</sub>

- *(minor)*
  New `@mirrordown/sat-abbr`: abbreviations (`*[term]: definition`) for Sätteri, with the same output as `remd-abbr` and `mdit-abbr`, and included in `@mirrordown/preset-satteri`. The definition and term rules move into `@mirrordown/core` (`parseAbbreviations`, `createAbbreviationScan`), which `remd-abbr` now uses too; its output is unchanged.
- *(patch)*
  Sätteri 0.11 reads attribute blocks and definition lists the way Mirrordown's other engines do, so the Sätteri suite now covers every feature:

  - `preset-satteri` has `attrs` and `definitionList` options, on by default like the other presets, which turn on Sätteri's own `attributes` and `definitionList` features. With them, the preset renders every shared fixture as `preset-remark` and `preset-markdown-it` do.
  - The `sat-*` packages accept Sätteri 0.11 as well as 0.10 (`^0.10.5 || ^0.11.0`); Astro's Sätteri integration is still on 0.10, where the plugins work as before.
  - An attribute block ending a tab or step header (`% Tab {.tab}`, `@1. Step {.step}`) now goes on the item in `sat-tabs` and `sat-steps`, as in the other engines: Sätteri read it off the header's paragraph before recognition, and the item didn't get it.
  - `sat-ruby` parses a ruby's base and reading with the document's features, which Sätteri 0.11.3 and later tell plugins; its `features` option is only needed with an older Sätteri.
