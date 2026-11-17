# Changelog



## 0.2.1
<sub>2026-11-17</sub>

- *(patch)*
  Fixes for the link markdown-it writes, and for options the three engines read differently.

  - **The heading's id is escaped in the link** (markdown-it). With the attrs plugin a heading can be given any id:

    ```markdown
    ## T {id='a"b'}
    ```

    Was `<a class="anchor" … href="#a"b">`: the quote ended the `href` early, so the rest of the id was read as a new attribute. Now `href="#a&quot;b"`, as in remark and Sätteri. The `class` option is escaped the same way.

  - **An unknown `behavior` throws** (all engines). A value that is none of `prepend`, `append`, `wrap`, `before` and `after` used to give no link in markdown-it and, in remark and Sätteri, a link placed as `append` without its `aria-hidden` and `tabindex`.

  - **`behavior: null` means the default, `prepend`** (Sätteri). It used to place the link as `append`, without its `aria-hidden` and `tabindex`.

  - **The link points at an id set through `headingProperties`** (Sätteri). With `headingProperties: { id: "other" }`, `## T` used to get `<h2 id="other">` with a link to `#t`; the link is now `href="#other"`, as in remark, and the `properties`, `content` and `group` callbacks see the new properties.

## 0.2.0
<sub>2026-11-11</sub>

- *(minor)*
  Require Sätteri 0.11.3 or later, which Astro ships from 7.4.7 (`@astrojs/markdown-satteri` 0.4.7). The plugins now read the document's features from Sätteri itself, so in Astro `satteriRuby()` needs no `features` passed to it, and tabs and steps no longer allow for a Sätteri that passes none. On Astro 7.4.6 or earlier, update Astro first.

## 0.1.0
<sub>2026-10-28</sub>

- *(minor)*
  Sätteri ports of the hast plugins: `@mirrordown/sat-squeeze-paragraphs`, `sat-unwrap-images`, `sat-sectionize`, `sat-lightbox` and `sat-autolink-headings`, all included in `@mirrordown/preset-satteri` (whose stylesheet now also imports the lightbox and autolink-headings styles). Their output is identical to the markdown-it and rehype plugins'. `sat-autolink-headings` takes the same options as `remd-autolink-headings`, including the hast-node ones (`content`, `group`, `properties`, `headingProperties`, `test`).

  The rules these engines must compute identically move into `@mirrordown/core` (`isEmptyParagraph`, `isImageParagraph`, `sectionize`, `headingRank`, and the lightbox's marker, ids and markup), which the rehype plugins now use too; their output is unchanged, and squeeze-paragraphs and unwrap-images drop `hast-util-whitespace`.
- *(patch)*
  Sätteri 0.11 reads attribute blocks and definition lists the way Mirrordown's other engines do, so the Sätteri suite now covers every feature:

  - `preset-satteri` has `attrs` and `definitionList` options, on by default like the other presets, which turn on Sätteri's own `attributes` and `definitionList` features. With them, the preset renders every shared fixture as `preset-remark` and `preset-markdown-it` do.
  - The `sat-*` packages accept Sätteri 0.11 as well as 0.10 (`^0.10.5 || ^0.11.0`); Astro's Sätteri integration is still on 0.10, where the plugins work as before.
  - An attribute block ending a tab or step header (`% Tab {.tab}`, `@1. Step {.step}`) now goes on the item in `sat-tabs` and `sat-steps`, as in the other engines: Sätteri read it off the header's paragraph before recognition, and the item didn't get it.
  - `sat-ruby` parses a ruby's base and reading with the document's features, which Sätteri 0.11.3 and later tell plugins; its `features` option is only needed with an older Sätteri.
