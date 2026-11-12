---
"@mirrordown/mdit-lightbox": patch
"@mirrordown/remd-lightbox": patch
"@mirrordown/sat-lightbox": patch
---

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
