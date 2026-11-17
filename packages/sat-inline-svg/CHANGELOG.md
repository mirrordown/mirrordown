# Changelog



## 0.2.1
<sub>2026-11-17</sub>

- *(patch)*
  Fixes for inlined SVGs that came out broken, and for images the three engines resolved or rejected differently.

  - **Alt text holding a `$` is inserted as written** (all engines).

    ```markdown
    ![Price: $1](./circle.svg)
    ```

    Was a broken tag: the `$1` pulled the SVG's own attributes into the label, `aria-label="Price:  xmlns="http://www.w3.org/2000/svg" width=…`. Now `<svg … aria-label="Price: $1">`. `$&` and `$$` are kept the same way.

  - **A missing or unparseable file leaves the image alone** (remark).

    ```markdown
    ![alt](./nope.svg)
    ```

    Was an error (`ENOENT`) that rejected the whole document, and every later document processed by the same processor with it. Now `<img src="./nope.svg" alt="alt">`, as in markdown-it and Sätteri. A file that is not SVG, and a document processed without a file `path`, are handled the same way; the latter used to throw `Cannot inline SVG images because the path of the HTML file is unknown`.

  - **A leading slash and encoded characters name the same file in every engine** (remark).

    ```markdown
    ![alt](/icons/star.svg)
    ```

    Was read from the root of the filesystem (and failed). Now read from `icons/star.svg` under the document's directory, as in markdown-it and Sätteri. An encoded separator (`icons%2Fstar.svg`) names that same file, and a `src` that is an external URL once decoded (`%2F%2Fexample.com/x.svg`) is left as an `<img>`.

  - **A malformed percent-escape leaves the image alone** (all engines).

    ```markdown
    ![alt](./%FF.svg)
    ```

    Was a `URIError: URI malformed` that failed the render. Now `<img src="./%FF.svg" alt="alt">`.

  - **A self-closing root stays closed when it is labelled** (all engines). An SVG that is empty once optimized is written `<svg …/>`; with alt text the label was added after the slash, `<svg …/ aria-label="alt">`, which left the element open so it swallowed the text after it. It is now `<svg … aria-label="alt"/>`.

  - **Two inlined SVGs no longer share ids** (all engines). The default optimization shortens ids to `a`, `b` and so on, so two files with a gradient each both defined `id="a"` and the second was painted with the first one's gradient. Ids are now prefixed per file: `id="svg-sprite-1skkiae__a"` with `url(#svg-sprite-1skkiae__a)`. This changes the ids in the output of any SVG that keeps ids; SVGs without ids render as before, and a `plugins` list in your own SVGO config still replaces the default one.

  - **With `deduplication: true`, a repeated SVG keeps the attributes of its root** (all engines). Only `viewBox`, `width` and `height` were carried over, so an outline icon whose root has `fill="none" stroke="currentColor" stroke-width="1.5"` rendered as a filled shape with `width="1.5"`. Each reference is now `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="size-6" …><use href="#…"></use></svg>`.

  - **An edited SVG file is read again** (all engines). A plugin kept every file it had read for as long as it lived, so a dev server showed an edited icon as it was when the server started. A file is now read again when its modification time or size changes.

  The READMEs now say that the markdown and the SVG files it names are treated as trusted input, and describe `maxImageSize`, `maxOccurrences` and `maxTotalSize` as what they are: per SVG file, in characters of the optimized content.

## 0.2.0
<sub>2026-11-11</sub>

- *(minor)*
  Require Sätteri 0.11.3 or later, which Astro ships from 7.4.7 (`@astrojs/markdown-satteri` 0.4.7). The plugins now read the document's features from Sätteri itself, so in Astro `satteriRuby()` needs no `features` passed to it, and tabs and steps no longer allow for a Sätteri that passes none. On Astro 7.4.6 or earlier, update Astro first.

## 0.1.0
<sub>2026-10-28</sub>

- *(minor)*
  New `@mirrordown/sat-inline-svg`: inlines referenced local `.svg` images as `<svg>` elements in Sätteri, resolving them against the `fileURL` compile option, with the same output as `mdit-inline-svg` and `remd-inline-svg`. The size limits, deduplication and markup move into `@mirrordown/core` (`inlineSvgMarkup`, `svgSpriteId`), which the markdown-it and rehype plugins now use too; their output is unchanged. Like the other presets, `@mirrordown/preset-satteri` leaves it out because it reads files from disk.
- *(patch)*
  Sätteri 0.11 reads attribute blocks and definition lists the way Mirrordown's other engines do, so the Sätteri suite now covers every feature:

  - `preset-satteri` has `attrs` and `definitionList` options, on by default like the other presets, which turn on Sätteri's own `attributes` and `definitionList` features. With them, the preset renders every shared fixture as `preset-remark` and `preset-markdown-it` do.
  - The `sat-*` packages accept Sätteri 0.11 as well as 0.10 (`^0.10.5 || ^0.11.0`); Astro's Sätteri integration is still on 0.10, where the plugins work as before.
  - An attribute block ending a tab or step header (`% Tab {.tab}`, `@1. Step {.step}`) now goes on the item in `sat-tabs` and `sat-steps`, as in the other engines: Sätteri read it off the header's paragraph before recognition, and the item didn't get it.
  - `sat-ruby` parses a ruby's base and reading with the document's features, which Sätteri 0.11.3 and later tell plugins; its `features` option is only needed with an older Sätteri.
