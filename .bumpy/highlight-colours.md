---
"@mirrordown/mdit-mark": minor
"@mirrordown/remd-mark": minor
"@mirrordown/sat-mark": minor
"@mirrordown/core": minor
"markdown-mark": minor
---

Highlight colours, as Obsidian writes them: a highlight that starts with a colour emoji is coloured. A highlight that starts with one of these emoji renders differently than before.

- **A colour emoji straight after the opening `==` colours the highlight** (all engines). The emoji is removed and the colour is named on the `<mark>`.

  ```markdown
  ==🔴Important== and ==🟢 done==
  ```

  Was `<mark>🔴Important</mark>` and `<mark>🟢 done</mark>`. Now `<mark data-highlight="red">Important</mark>` and `<mark data-highlight="green"> done</mark>`. Six colours, each with a circle and a square: 🔴🟥 red, 🟠🟧 orange, 🟡🟨 yellow, 🟢🟩 green, 🔵🟦 blue, 🟣🟪 purple. The emoji counts only as the highlight's very first character: `==te🔴xt==` and `==**🔴bold**==` are plain highlights, and one written as a character reference is text.

- **A stylesheet for the six colours** (all engines). The set shipped none before. Import `@mirrordown/mdit-mark/styles`, `@mirrordown/remd-mark/mark.css` or `@mirrordown/sat-mark/mark.css`; without it a coloured highlight looks like a plain one. Each colour is a translucent tint that reads on a light and on a dark page, and can be set with a custom property:

  ```css
  :root { --markdown-mark-red: oklch(0.7 0.2 25 / 40%); }
  ```

  A plain `<mark>` keeps the browser's own style.

- **A `data-highlight` written in an attribute block wins** (all engines), with the attrs plugin or Sätteri's `attributes` feature: `==🔴text=={data-highlight=blue}` is blue.

The VS Code extension shows the colours in the preview, in light and dark themes.

`@mirrordown/core` gains `HIGHLIGHT_COLOURS`, `splitHighlightColour` and `takeHighlightColour`.
