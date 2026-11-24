# Changelog




## 0.2.2
<sub>2026-11-24</sub>

- *(patch)* Updated dependency `@mirrordown/core` v0.3.0

## 0.2.1
<sub>2026-11-17</sub>

- *(patch)*
  Fixes for edge cases where the three engines read `[[key]]` differently. Two of them change what existing documents render: in remark and Sätteri a key now wins over a link that shares its brackets, and in markdown-it a key now treats inline code, links and line breaks inside it as the other engines do.

  - **A key whose name is also a link reference is a key** (remark, Sätteri).

    ```markdown
    [[a]]

    [a]: /u
    ```

    Was `[<a href="/u">a</a>]`. Now `<kbd>a</kbd>`, as in markdown-it.

  - **A key followed by parentheses or a reference is a key, not a link** (remark, Sätteri).

    ```markdown
    [[a]](url)
    ```

    Was `<a href="url">[a]</a>`. Now `<kbd>a</kbd>(url)`, as in markdown-it. Likewise `[[a]][ref]` is a key followed by the link `ref`, and `![[a]]` is `!` and a key.

  - **An attribute block written right after a key goes on the `<kbd>`** (Sätteri, with its `attributes` feature on).

    ```markdown
    x [[Ctrl]]{.key} y
    ```

    Was `x <kbd>Ctrl</kbd>{.key} y`, and at the end of a paragraph the class went on the `<p>`. Now `x <kbd class="key">Ctrl</kbd> y`, as in markdown-it and remark.

  - **Closing brackets inside inline code, an autolink or an HTML tag do not close the key** (markdown-it).

    ```markdown
    [[a `]]` b]]
    ```

    Was ``<kbd>a <code>]]</code></kbd>` b]]``. Now `<kbd>a <code>]]</code> b</kbd>`, as in remark and Sätteri.

  - **A link inside a key is part of the key** (markdown-it).

    ```markdown
    [[x [a]]]

    [a]: /u
    ```

    Was `<kbd>x [a</kbd>]`. Now `<kbd>x <a href="/u">a</a></kbd>`, as in remark and Sätteri.

  - **A backslash line break ends the key attempt** (markdown-it).

    ```markdown
    [[a\
    b]]
    ```

    Was `<kbd>a<br>b</kbd>`. Now the text `[[a<br>b]]`, as in remark and Sätteri. A code span that runs over a line ending inside a key no longer stops the key either.

  - **An escaped key stays text after another plugin's span** (remark, Sätteri).

    ```markdown
    --a-- \[[x]]
    ```

    Was `<del>a</del> <kbd>x</kbd>`. Now `<del>a</del> [[x]]`, as in markdown-it.

  - **An escape is still honoured after smart punctuation** (Sätteri, with smart punctuation on).

    ```markdown
    "q" \[[x]] [[y]]
    ```

    Was `“q” <kbd>x</kbd> <kbd>y</kbd>`. Now `“q” [[x]] <kbd>y</kbd>`. The same went wrong in remark and Sätteri after a character reference that decodes to two characters, such as an emoji.

  - **A bracket written as a character reference is not a bracket** (remark, Sätteri).

    ```markdown
    &#91;[x]]
    ```

    Was `<kbd>x</kbd>`. Now the text `[[x]]`.

  - **Keys nest up to 100 deep** (remark, Sätteri). Deeper brackets stay text, as in markdown-it. remark used to overflow the stack on a few thousand levels and Sätteri rejected the whole document past 128.

  - **A line of unclosed `[[` is scanned in linear time** (all engines). 40 KB of them took about seven seconds.

  - **A lone carriage return is a line ending, so no key forms across it** (remark, Sätteri).

  - **Private Use characters you typed are kept** (remark, Sätteri). Characters in the range U+F0021 to U+F007E, where some icon fonts put their glyphs, were rewritten to ASCII punctuation, so two of them could even turn into brackets.

  The guide now says that a key wins over a link, and lists the differences between engines that remain.

## 0.2.0
<sub>2026-11-11</sub>

- *(minor)*
  Require Sätteri 0.11.3 or later, which Astro ships from 7.4.7 (`@astrojs/markdown-satteri` 0.4.7). The plugins now read the document's features from Sätteri itself, so in Astro `satteriRuby()` needs no `features` passed to it, and tabs and steps no longer allow for a Sätteri that passes none. On Astro 7.4.6 or earlier, update Astro first.

## 0.1.0
<sub>2026-10-28</sub>

- *(minor)*
  `[[key]]` now scans the same way in every engine. `@mirrordown/core`'s new `createKbdTransform` ports markdown-it-kbd's tokenizer, and `remd-kbd` and the new `@mirrordown/sat-kbd` run on it:

  - Keys nest: `[[a [[b]] c]]`.
  - A single `]` stays inside a key: `[[a]b]]`.
  - A line ending before the closing `]]` cancels the key even when formatting sits in between.
  - `[[[a]]` keeps the extra `[` outside the key.

  `remd-kbd` drops its `unist-util-find-*` and `unist-builder` dependencies. One difference is inherent to the engines and documented in the guide: markdown-it reads `[[*a]]*` as a key, while remark and Sätteri have already read the emphasis.

  `@mirrordown/sat-kbd` is included in `@mirrordown/preset-satteri`.
- *(patch)*
  Sätteri 0.11 reads attribute blocks and definition lists the way Mirrordown's other engines do, so the Sätteri suite now covers every feature:

  - `preset-satteri` has `attrs` and `definitionList` options, on by default like the other presets, which turn on Sätteri's own `attributes` and `definitionList` features. With them, the preset renders every shared fixture as `preset-remark` and `preset-markdown-it` do.
  - The `sat-*` packages accept Sätteri 0.11 as well as 0.10 (`^0.10.5 || ^0.11.0`); Astro's Sätteri integration is still on 0.10, where the plugins work as before.
  - An attribute block ending a tab or step header (`% Tab {.tab}`, `@1. Step {.step}`) now goes on the item in `sat-tabs` and `sat-steps`, as in the other engines: Sätteri read it off the header's paragraph before recognition, and the item didn't get it.
  - `sat-ruby` parses a ruby's base and reading with the document's features, which Sätteri 0.11.3 and later tell plugins; its `features` option is only needed with an older Sätteri.
