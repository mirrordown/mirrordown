---
"@mirrordown/mdit-image-size": minor
"@mirrordown/remd-image-size": minor
"@mirrordown/sat-image-size": minor
"@mirrordown/core": minor
---

Add the image-size plugin set: the size Obsidian reads from an image's description becomes `width` and `height` on the `<img>`, the same in markdown-it, remark and Sätteri.

- **A description that ends in `|W` or `|WxH` sizes the image.**

  ```markdown
  ![Engelbart|100x145](engelbart.jpg)
  ![Engelbart|100](engelbart.jpg)
  ```

  Renders `<img src="engelbart.jpg" alt="Engelbart" width="100" height="145">` and `<img src="engelbart.jpg" alt="Engelbart" width="100">`. The size leaves the alt text. Only the last `|` is read, so `![a|b|100](…)` has the alt `a|b`.

- **A description that is only a size leaves the alt empty.**

  ```markdown
  ![250](engelbart.jpg)
  ```

  Renders `<img src="engelbart.jpg" alt="" width="250">`. So an alt text cannot be only a number, or end in `|` and a number.

- **Nothing else is a size:** `|100px`, `|50%`, `|0`, `|100X145` and a size followed by a space stay in the alt text. A width and a height are one to five digits.

- **In a GFM table cell, write the pipe as `\|`:** `![chart\|60](chart.png)`.

- **An attribute block wins.** With the attrs plugin or Sätteri's `attributes` feature, `![a|100](…){width=50}` has `width="50"`.

The set only writes the two attributes. A host's image pipeline does the rest: Astro's Markdown processors pass them to its image pipeline, which resizes at build time. On a plain page they reserve the image's space; keep `height: auto` in your CSS for images given a width alone.

`@mirrordown/core` gains `parseImageSize`.
