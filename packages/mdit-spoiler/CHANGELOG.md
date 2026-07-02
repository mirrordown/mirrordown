# Changelog


## 0.1.1
<sub>2026-07-02</sub>

- *(patch)*
  Fix an infinite loop / thrown error when `mdit-spoiler` and `mdit-sub` are both active and a document contains an unclosed `~` (e.g. `~15k`). `mdit-spoiler` replaces markdown-it's core `text` rule to make `|` a terminator, but at the inline boundary (`state.pos === state.posMax`) it returned `true` without advancing `state.pos`, violating markdown-it's rule contract — markdown-it 14 throws "inline rule didn't increment state.pos", while the older markdown-it bundled in VSCode's markdown preview caches the non-advancing result and loops forever, wedging the extension host. `mdit-sub`'s scan loop also probed one position too far (`<= max` instead of `< max`; `posMax` is exclusive), which is what reached the boundary. Both are fixed independently: `mdit-spoiler`'s `text` replacement now returns `false` when there is nothing to consume, and `mdit-sub` scans with `< max`. Adds a regression test that renders `about ~15k lines` with both plugins.

## 0.1.0
<sub>2026-07-01</sub>

- *(minor)*
  Add the spoiler plugin set: Discord-style `||spoiler||` click-to-reveal for inline content and images. Inline text becomes an obscured bar (per-line via `box-decoration-break`); wrap an image (`||![](…)||`) and it renders heavily blurred with a centered **SPOILER** pill, revealing the sharp image on click — Discord's image-spoiler treatment. The whole interaction is a `<label>` wrapping a visually-hidden checkbox and the content, revealed with the `:checked` sibling selector, so **no JavaScript runs** and it works in the VSCode preview. Keyboard-operable (Space) and announced as a spoiler control by screen readers. Combines with `lightbox` (`||!![](…)||`) for a spoilered image that is also click-to-zoom once revealed. The markdown-it and remark plugins emit identical HTML. Also bundles the `markdown-spoiler` VSCode preview extension in the extension pack.
