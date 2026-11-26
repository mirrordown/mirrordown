# Changelog








## 0.2.3
<sub>2026-11-26</sub>

- *(patch)* Updated dependency `@mirrordown/core` v0.4.0

## 0.2.2
<sub>2026-11-24</sub>

- *(patch)* Updated dependency `@mirrordown/core` v0.3.0

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
<sub>2026-10-28</sub>

- *(minor)*
  `remd-inline-svg` now gives an inlined `<svg>` its accessible name through `aria-label`, taken from the image's alt text, as `mdit-inline-svg` does. It previously copied `alt` onto the `<svg>`, where it is not a valid attribute, and wrote `alt=""` for images without alt text; an empty alt now adds no attribute.
- *(minor)*
  `remd-inline-svg` now inserts the SVG file's markup verbatim as a `raw` node instead of parsing it into hast elements, so its output is byte-for-byte the same as `mdit-inline-svg` (previously hast re-serialized the SVG, rewriting values such as `fill-opacity=".5"` to `"0.5"` and `<path/>` to `<path></path>`). **Breaking:** `rehype-stringify` now needs `allowDangerousHtml: true`, and later rehype plugins see the inlined SVG as an opaque string rather than an element tree. With `deduplication`, the hidden sprite is now emitted right before the first `<use>` reference, as in `mdit-inline-svg`, instead of at the start of the document.

  Both packages: with `deduplication`, sprite ids are now derived from the SVG's path relative to the document instead of its absolute path, so the same document produces the same ids on every machine and OS.
- *(patch)*
  New `@mirrordown/sat-inline-svg`: inlines referenced local `.svg` images as `<svg>` elements in Sätteri, resolving them against the `fileURL` compile option, with the same output as `mdit-inline-svg` and `remd-inline-svg`. The size limits, deduplication and markup move into `@mirrordown/core` (`inlineSvgMarkup`, `svgSpriteId`), which the markdown-it and rehype plugins now use too; their output is unchanged. Like the other presets, `@mirrordown/preset-satteri` leaves it out because it reads files from disk.

## 0.1.3
<sub>2026-06-28</sub>

- *(patch)*
  Improve JSR package scores: add package descriptions, document all exported symbols (JSDoc), add READMEs for the inline-svg packages, clear slow-type errors on the exported hast handlers, and trim internal regex constants from the public API.

## 0.1.2
<sub>2026-06-28</sub>

- *(patch)*
  First publish to JSR (alongside npm). All 30 packages are claimed on the
  @mirrordown JSR scope with the repo linked, so `npx jsr publish` authenticates
  via GitHub Actions OIDC — no token. Publishes 0.1.2 to npm and JSR together.

## 0.1.1
<sub>2026-06-25</sub>

- *(patch)*
  fix: resolve `catalog:` protocol in published dependencies

  0.1.0 was published with Yarn's `catalog:` specifier left literally in
  `dependencies`/`devDependencies`, so consumers could not install the affected
  packages. Packages are now packed with `yarn pack` (which resolves `catalog:`
  to the concrete version ranges from `.yarnrc.yml`) before `npm publish`.

## 0.1.0

<sub>2026-06-23</sub>

- _(minor)_

  # Initial release

  First public release of the `@mirrordown/markdown` suite — a collection of markdown syntax extensions for the [unified](https://unifiedjs.com/) (remark/rehype) and [markdown-it](https://github.com/markdown-it/markdown-it) ecosystems.

  ## Packages

  **Remark/rehype plugins** (`@mirrordown/remd-*`):
  - `abbr` — abbreviation definitions that auto-expand matching text with `<abbr>` tooltips
  - `attrs` — `{attrs}` syntax for adding HTML attributes to markdown elements
  - `definition-list` — `<dl>`/`<dt>`/`<dd>` syntax from PHP Markdown Extra
  - `del` — `~~strikethrough~~` rendered as `<del>` instead of `<s>`
  - `github-alerts` — `> [!NOTE]` callout boxes matching GitHub's alert syntax
  - `inline-svg` — inlines local `.svg` images into the HTML output with size/occurrence/sprite controls
  - `ins` — `++inserted text++` rendered as `<ins>`
  - `kbd` — `[[Ctrl]]+[[C]]` syntax for `<kbd>` keyboard input elements
  - `mark` — `==highlighted text==` rendered as `<mark>`
  - `ruby` — DenDen-ruby syntax (`{base|reading}`) for `<ruby>`/`<rt>`/`<rp>` annotations
  - `steps` — numbered `@N. step` syntax for procedural guides
  - `sub` — `~subscript~` rendered as `<sub>`
  - `sup` — `^superscript^` rendered as `<sup>`
  - `tabs` — `% Tab` syntax for tabbed content panels
  - `unwrap-images` — lifts block-only images out of wrapping `<p>` tags

  **Markdown-it plugins** (`@mirrordown/mdit-*`): same plugin set, ported for the markdown-it pipeline.

  **VSCode extensions** (`markdown-*`): each plugin wrapped as a VSCode extension that contributes its syntax to the built-in markdown preview. (Publishing to the VSCode Marketplace is wired separately and is not part of this npm release.)

  ## Highlights
  - Designed to work together — `attrs` understands custom container nodes from `tabs`/`steps`/`definition-list`/`github-alerts`, and `tabs`/`steps` nest bidirectionally.
  - Type-aware: every package ships `.d.mts` declarations and externalizes `unist`/`mdast`/`hast` types so downstream consumers see compatible types.
  - Tested: 880 tests covering every plugin's syntax, plus cross-plugin integration tests for nested constructs (tabs-in-steps, attrs-on-defList, github-alerts-with-attrs, etc.).
  - Documented at [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown).
