---
"@mirrordown/mdit-inline-svg": patch
"@mirrordown/remd-inline-svg": patch
"@mirrordown/sat-inline-svg": patch
---

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
