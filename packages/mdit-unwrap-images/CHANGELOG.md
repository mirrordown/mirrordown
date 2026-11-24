# Changelog






## 0.2.0
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
- *(patch)*
  markdown-it's unwrap-images takes time in proportion to the document.

  - **Many image paragraphs no longer cost the square of their number** (markdown-it). Each unwrapped paragraph moved every token after it. The output does not change.

    ```markdown
    ![a](a.png)

    ![b](b.png)
    ```

    20,000 of these paragraphs took the plugin about 0.6 s on top of markdown-it's own time, four times what 10,000 took. Now twice as many take twice as long.

## 0.1.4
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
