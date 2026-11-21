---
"@mirrordown/preset-markdown-it": minor
"@mirrordown/preset-remark": minor
"@mirrordown/preset-satteri": minor
---

Highlights take Obsidian's colours, and the presets' stylesheets include the mark set's new one.

- **A highlight that starts with a colour emoji is coloured.**

  ```markdown
  ==🔴Important==
  ```

  Was `<mark>🔴Important</mark>`. Now `<mark data-highlight="red">Important</mark>`, tinted red by the preset's stylesheet. The same goes for 🟠🟡🟢🔵🟣 and the squares 🟥🟧🟨🟩🟦🟪. Put a space or any other character before the emoji, or write a backslash before the opening `==`, to keep it as text.
