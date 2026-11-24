---
"@mirrordown/mdit-unwrap-images": minor
"@mirrordown/remd-unwrap-images": minor
"@mirrordown/sat-unwrap-images": minor
"@mirrordown/core": minor
"@mirrordown/remd-steps": patch
"@mirrordown/sat-steps": patch
"@mirrordown/remd-github-alerts": patch
"@mirrordown/sat-github-alerts": patch
---

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
