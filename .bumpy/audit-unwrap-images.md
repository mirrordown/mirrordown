---
"@mirrordown/mdit-unwrap-images": patch
"@mirrordown/remd-unwrap-images": patch
"@mirrordown/sat-unwrap-images": patch
---

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
