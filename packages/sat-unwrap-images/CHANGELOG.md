# Changelog





## 0.3.1
<sub>2026-11-26</sub>

- *(patch)* Updated dependency `@mirrordown/core` v0.4.0

## 0.3.0
<sub>2026-11-24</sub>

- *(minor)*
  unwrap-images no longer loses what a paragraph carried: an image alone in a paragraph takes the paragraph's attributes.

  - **One image takes its paragraph's attributes** (all engines): the id, the classes and every other attribute, from an attribute block on its own line or from a block identifier, also when the image is inside a link or a lightbox button. A link to the id finds the image again.

    ```markdown
    ![a](pic.png)
    {#hero .wide}
    ```

    Was `<img src="pic.png" alt="a">`. Now `<img src="pic.png" alt="a" id="hero" class="wide">`.

    ```markdown
    ![a](pic.png) ^img
    ```

    Was `<img src="pic.png" alt="a">`. Now `<img src="pic.png" alt="a" id="^img">`.

  - **The image's own attributes win, and classes add up** (all engines).

    ```markdown
    ![a](pic.png){#own .c}
    {#x .wide}
    ```

    Was `<img src="pic.png" alt="a" id="own" class="c">`. Now `<img src="pic.png" alt="a" id="own" class="c wide">`.

  - **A paragraph with attributes and several images is kept** (all engines): an id can name one element, and a class on a group of images is about the group. Without attributes, several images are unwrapped as before.

    ```markdown
    ![a](a.png) ![b](b.png)
    {.gallery}
    ```

    Was `<img src="a.png" alt="a"> <img src="b.png" alt="b">`. Now `<p class="gallery"><img src="a.png" alt="a"> <img src="b.png" alt="b"></p>`.

  - **A step's title, an alert's title and a lightbox caption are never unwrapped** (remark and Sätteri; markdown-it never did). They are a plugin's own `<p>`, not an image paragraph.

    ```markdown
    @1. ![a](a.png)
    >  body
    ```

    Was, in remark and Sätteri, `<li class="markdown-steps-item" data-step="1"><img src="a.png" alt="a"><div class="markdown-steps-body">…`. Now, as in markdown-it, `<li class="markdown-steps-item" data-step="1"><p class="markdown-steps-title"><img src="a.png" alt="a"></p><div class="markdown-steps-body">…`. The same holds for `> [!note] ![a](a.png)` with `icons: false`, and for a lightbox dialog's caption.

  `@mirrordown/remd-steps`, `@mirrordown/sat-steps`, `@mirrordown/remd-github-alerts` and `@mirrordown/sat-github-alerts` mark the title they build with a property that is never printed (`markdownParagraph: false`), which unwrap-images reads. Their HTML does not change on its own.

  `@mirrordown/core` gains `unwrapImageParagraph` and `MARKDOWN_PARAGRAPH`.

## 0.2.1
<sub>2026-11-17</sub>

- *(patch)*
  Fixes for paragraphs that the markdown-it plugin left wrapped where remark and Sätteri unwrap them; the remark and Sätteri plugins render as before.

  - **An image inside a link is unwrapped** (markdown-it).

    ```markdown
    [![a](a.png)](https://example.com)
    ```

    Was `<p><a href="https://example.com"><img src="a.png" alt="a"></a></p>`. Now the `<a>` without the `<p>`, as in remark and Sätteri.

  - **Images separated by a space are unwrapped, and the space is kept** (markdown-it).

    ```markdown
    ![a](a.png) ![b](b.png)
    ```

    Was `<p><img src="a.png" alt="a"> <img src="b.png" alt="b"></p>`. Now the two images and the space between them without the `<p>`, as in remark and Sätteri. The same goes for two lightbox images on one line (`!![a](a.png) !![b](b.png)`), which kept their `<p>` around the two buttons.

  The guide now says what unwrapping takes with it (attributes written on the paragraph) and which order to list the plugin in.

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
