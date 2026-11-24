# Changelog




## 0.1.3
<sub>2026-11-24</sub>

- *(patch)* Updated dependency `@mirrordown/core` v0.3.0

## 0.1.2
<sub>2026-11-17</sub>

- *(patch)*
  Fixes for cases where a `||spoiler||` formed in one engine and not another, which either hides text you meant to show or shows text you meant to hide.

  - **Without `spoilerHastHandlers`, the remark plugin keeps the content covered** (remark). The handlers are still required for a spoiler that can be revealed; this is what happens when they are not passed to `remark-rehype`.

    ```markdown
    a ||b|| c
    ```

    Was `a <div>b</div> c`, the content in the clear. Now `a <span class="markdown-spoiler-content">b</span> c`, which the stylesheet covers and nothing reveals.

  - **A spoiler in a table cell forms** (remark, Sätteri). In a cell the pipes have to be written `\|`.

    ```markdown
    | h |
    | - |
    | \|\|x\|\| |
    ```

    Was the text `||x||` in the cell. Now a spoiler, as in markdown-it.

  - **An attribute block written right after a spoiler is read and dropped** (Sätteri, with its `attributes` feature on).

    ```markdown
    ||secret||{.danger}
    ```

    Was `<p class="danger">` around the spoiler, and mid-paragraph the block stayed on the page as text. Now the paragraph has no class and the block is gone, as in markdown-it and remark.

  - **Escaped pipes stay text after another plugin's span** (remark, Sätteri).

    ```markdown
    ==a== \||b||
    ```

    Was a spoiler around `b`. Now `<mark>a</mark> ||b||`, as in markdown-it.

  - **An escape is still honoured after smart punctuation** (Sätteri, with smart punctuation on).

    ```markdown
    "q" \||a||
    ```

    Was a spoiler around `a`. Now `“q” ||a||`.

  - **A pipe written as a character reference is not a delimiter** (remark, Sätteri).

    ```markdown
    &#124;&#124;text||
    ```

    Was a spoiler around `text`. Now the text `||text||`.

  - **The text of an autolink is left alone** (remark, Sätteri).

    ```markdown
    <http://x/||b||>
    ```

    Was a link with a spoiler around `b` in its text. Now the link text is the URL as written.

  - **An escaped character or a character reference beside the pipes counts as punctuation** (remark, Sätteri). This decides whether a pair of pipes can open or close.

    ```markdown
    a||\*b||
    ```

    Was `a` and a spoiler around `*b`. Now the text `a||*b||`, as in markdown-it.

  - **A backslash line break right after the opening pipes does not stop them from opening** (remark, Sätteri).

    ```markdown
    (||\
    a||
    ```

    Now a spoiler around the line break and `a`, as in markdown-it.

  - **Spoilers nest up to 50 deep** (all engines). The pipes of deeper ones stay text. Sätteri used to reject the whole document when spoilers nested too deep: each one counts twice toward its limit of 128 levels.

  The guide now lists the differences between engines that remain.

## 0.1.1
<sub>2026-10-28</sub>

- *(patch)*
  Backslash-escaped delimiters are now literal in `remd-mark`, `remd-ins`, `remd-del`, `remd-kbd`, `remd-spoiler`, `remd-sub` and `remd-sup`, as they already were in the `mdit-*` plugins: `\==not marked==` renders as `==not marked==` instead of a `<mark>`, while an escaped backslash (`\==marked==`) still allows the markup. These plugins now depend on the new `@mirrordown/core` package, which holds logic shared across Mirrordown's engines.
- *(patch)*
  `||spoiler||` now pairs delimiters with markdown-it's rules in every engine: `remd-spoiler` runs on `@mirrordown/core`'s delimiter scan (which gains the `|` marker), so a closer pairs with the nearest opener, spoilers nest, and an odd-length run's extra `|` stays outside; it drops its `unist-util-find-*` and `unist-builder` dependencies.

  New `@mirrordown/sat-spoiler` renders the same JavaScript-free click-to-reveal markup, ships the same stylesheet, and is included in `@mirrordown/preset-satteri`.

## 0.1.0
<sub>2026-07-01</sub>

- *(minor)*
  Add the spoiler plugin set: Discord-style `||spoiler||` click-to-reveal for inline content and images. Inline text becomes an obscured bar (per-line via `box-decoration-break`); wrap an image (`||![](…)||`) and it renders heavily blurred with a centered **SPOILER** pill, revealing the sharp image on click — Discord's image-spoiler treatment. The whole interaction is a `<label>` wrapping a visually-hidden checkbox and the content, revealed with the `:checked` sibling selector, so **no JavaScript runs** and it works in the VSCode preview. Keyboard-operable (Space) and announced as a spoiler control by screen readers. Combines with `lightbox` (`||!![](…)||`) for a spoilered image that is also click-to-zoom once revealed. The markdown-it and remark plugins emit identical HTML. Also bundles the `markdown-spoiler` VSCode preview extension in the extension pack.
