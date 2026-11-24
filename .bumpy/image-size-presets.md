---
"@mirrordown/preset-markdown-it": minor
"@mirrordown/preset-remark": minor
"@mirrordown/preset-satteri": minor
---

Add `imageSize`, on by default like every other feature: an image's description can end in a size, as in Obsidian. Pages rendered with a preset change where an image's description ends that way.

- **`![alt|100x145](…)` and `![alt|100](…)` size the image.**

  ```markdown
  ![Engelbart|100x145](engelbart.jpg)
  ```

  Was `<img src="engelbart.jpg" alt="Engelbart|100x145">`. Now `<img src="engelbart.jpg" alt="Engelbart" width="100" height="145">`.

- **A description that is only a number is a width.**

  ```markdown
  ![2024](chart.png)
  ```

  Was `<img src="chart.png" alt="2024">`. Now `<img src="chart.png" alt="" width="2024">`. Write more than the number (`![Chart for 2024](chart.png)`), or pass `imageSize: false`.
