# Changelog





## 0.3.2
<sub>2026-11-24</sub>

- *(patch)*
  The dialog shows the image at full size whatever size it has on the page.

  - **A `width` or `height` on a lightbox image is left off the dialog's copy** (all engines), whether an attribute block gave it or the image-size plugin read it from the description.

    ```markdown
    !![A photo](photo.jpg){width=120}
    ```

    Was `<img src="photo.jpg" alt="A photo" width="120">` in the trigger and in the dialog. Now the trigger keeps `width="120"` and the dialog's image has none. The stylesheet already showed the dialog's image at its natural size, so a page looks the same; the difference is for a host that resizes images from these attributes, such as Astro's image pipeline, which would have made the full-size view as small as the thumbnail.

## 0.3.1
<sub>2026-11-17</sub>

- *(patch)*
  Fixes for lightbox images whose hand-written ids clash, and for the caption copied into the dialog.

  - **An id already used by another lightbox image falls back to the generated one** (all engines), with the attrs plugin or Sätteri's `attributes` feature.

    ```markdown
    !![a](x.jpg){#same} !![b](y.jpg){#same}
    ```

    Was one dialog, `same`, holding `x.jpg`, with both triggers pointing at it: the second image opened the first. Now the second trigger and its own dialog use the generated id (`markdown-lightbox-…`), so each image opens itself.

  - **An id that another element already has is not reused** (all engines).

    ```markdown
    # Title {#fig1}

    !![a](x.jpg){#fig1}
    ```

    Was a trigger with `commandfor="fig1"` and a second element with `id="fig1"`; the browser resolves that to the heading, so the image never opened. Now the heading keeps `fig1` and the image uses its generated id. Only ids that exist when the plugin runs are seen.

  - **Two ids on the same image give two dialogs** (all engines).

    ```markdown
    !![a](x.jpg){#one} !![b](x.jpg){#two}
    ```

    Was one dialog, `two`, with both triggers pointing at it; the id `one` vanished from the page, breaking any link to it. Now a dialog `one` and a dialog `two`, each opened by its own trigger.

  - **With `caption: true`, a lightbox image inside a caption is a trigger in the dialog's copy too** (remark, Sätteri), with the caption plugin.

    ```markdown
    !![a](x.jpg)
    ~: cap with !![b](y.jpg)
    ```

    Was a dialog caption reading `cap with !<img src="y.jpg" alt="b">`, a literal `!` before a plain image. Now `cap with <button class="markdown-lightbox-trigger" …><img src="y.jpg" alt="b"></button>`, the same as the `<figcaption>` and as in markdown-it.

  - **With `caption: true`, a caption that renders nothing leaves no caption in the dialog** (all engines).

    ```markdown
    !![a](a.png)
    ~: &#32;
    ```

    Was an empty `<p class="markdown-lightbox-caption"></p>` in the dialog. Now no caption element. A non-breaking space is content and is kept.

  - **The markdown-it plugin escapes the id it writes.** An id put on the image token by another plugin was written into `id` and `commandfor` as it was; a `"` or `<` in it is now escaped like any other attribute value.

  The guide now states which order to list lightbox in beside inline-svg and unwrap-images, that dialog ids are unique per document rather than per page, and that the `!` marker cannot be escaped (for a literal `!` before a plain image, write `! ![…](…)`).

## 0.3.0
<sub>2026-11-11</sub>

- *(minor)*
  Require Sätteri 0.11.3 or later, which Astro ships from 7.4.7 (`@astrojs/markdown-satteri` 0.4.7). The plugins now read the document's features from Sätteri itself, so in Astro `satteriRuby()` needs no `features` passed to it, and tabs and steps no longer allow for a Sätteri that passes none. On Astro 7.4.6 or earlier, update Astro first.

## 0.2.0
<sub>2026-10-28</sub>

- *(minor)*
  Captioned lightbox images: a lightbox image (`!![alt](src)`) followed by a `~:` caption is now the figure's content, so its trigger sits directly in the `<figure>` without unwrap-images. The lightbox plugins take a `caption` option (off by default) that shows a captioned image's caption under it in the dialog; repeated images share one dialog, which shows the first caption any of them has. The presets pass lightbox options through (`lightbox: { caption: true }`). The lightbox READMEs are now generated from its guide.

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
