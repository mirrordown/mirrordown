---
"@mirrordown/preset-markdown-it": minor
"@mirrordown/preset-remark": minor
"@mirrordown/preset-satteri": minor
---

Highlights take variants from a marker emoji, the presets' stylesheets include the mark set's new one, and `mark` takes options.

- **A highlight that starts with a marker emoji is a coloured pill.**

  ```markdown
  ==🔴Important== ==🐛 Bug==
  ```

  Was `<mark>🔴Important</mark>` and `<mark>🐛 Bug</mark>`. Now `<mark data-highlight="red">Important</mark>` and `<mark data-highlight="bug">🐛 Bug</mark>`, each drawn as a pill by the preset's stylesheet. The colour emoji 🔴🟠🟡🟢🔵🟣 and the squares 🟥🟧🟨🟩🟦🟪 are removed; the label emoji 🐛 📖 ✨ ❓ 🙋 🌱 👯 🚫 ⛔ ⚠️ are kept. Put any character before the emoji, or a backslash before the opening `==`, to keep a plain highlight.

- **`mark` takes the plugin's options**, as well as `true` and `false`: `mirrordown({ mark: { markers: { "🚀": "release", "🟡": false } } })` adds a marker and turns one off.
