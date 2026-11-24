---
"@mirrordown/mdit-unwrap-images": patch
---

markdown-it's unwrap-images takes time in proportion to the document.

- **Many image paragraphs no longer cost the square of their number** (markdown-it). Each unwrapped paragraph moved every token after it. The output does not change.

  ```markdown
  ![a](a.png)

  ![b](b.png)
  ```

  20,000 of these paragraphs took the plugin about 0.6 s on top of markdown-it's own time, four times what 10,000 took. Now twice as many take twice as long.
