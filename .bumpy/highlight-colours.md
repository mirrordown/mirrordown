---
"@mirrordown/mdit-mark": minor
"@mirrordown/remd-mark": minor
"@mirrordown/sat-mark": minor
"@mirrordown/core": minor
"markdown-mark": minor
---

Highlight variants: a highlight that starts with a marker emoji is a coloured pill, for Obsidian's highlight colours and for label-style badges. A highlight that starts with one of the default markers renders differently than before.

- **A colour emoji straight after the opening `==` colours the highlight** (all engines), as in Obsidian. The emoji is removed and the colour is named on the `<mark>`.

  ```markdown
  ==🔴Important== and ==🟢 done==
  ```

  Was `<mark>🔴Important</mark>` and `<mark>🟢 done</mark>`. Now `<mark data-highlight="red">Important</mark>` and `<mark data-highlight="green"> done</mark>`. Six colours, each with a circle and a square: 🔴🟥 red, 🟠🟧 orange, 🟡🟨 yellow, 🟢🟩 green, 🔵🟦 blue, 🟣🟪 purple.

- **Ten label markers name a variant and keep their emoji** (all engines): GitHub's default issue labels and a warning.

  ```markdown
  ==🐛 Bug== ==⚠️ Deprecated==
  ```

  Was plain highlights. Now `<mark data-highlight="bug">🐛 Bug</mark>` and `<mark data-highlight="warning">⚠️ Deprecated</mark>`. The markers are 🐛 `bug`, 📖 `documentation`, ✨ `enhancement`, ❓ `question`, 🙋 `help-wanted`, 🌱 `good-first-issue`, 👯 `duplicate`, 🚫 `invalid`, ⛔ `wontfix` and ⚠️ `warning`. The emoji stays, so a label can be told apart without its colour.

- **A marker counts only as the highlight's very first character.** `==te🔴xt==` and `==**🔴bold**==` are plain highlights, and a marker written as a character reference is text. `⚠` and `⚠️` are the same marker.

- **The `markers` option** (all engines) adds a marker, renames one, hides or shows its emoji, or turns a default off.

  ```ts
  remarkMark({
    markers: {
      "🚀": "release", // ==🚀 v2== is <mark data-highlight="release">🚀 v2</mark>
      "✅": { name: "done", keep: false }, // the emoji is removed
      "🟡": false // 🟡 is text again
    }
  })
  ```

- **A stylesheet draws every variant as a pill** (all engines), in the style of Vocs' badges: a tinted background, text in a stronger shade of the same colour, in a light and a dark scheme. The set shipped no stylesheet before. Import `@mirrordown/mdit-mark/styles`, `@mirrordown/remd-mark/mark.css` or `@mirrordown/sat-mark/mark.css`; without it a variant looks like a plain highlight. A plain `<mark>` keeps the browser's own style. Each default's colour can be set through a custom property, and a variant of your own takes one declaration:

  ```css
  :root { --markdown-mark-bug: oklch(0.6 0.2 5); }
  mark[data-highlight="release"] { --markdown-mark-color: oklch(0.6 0.15 300); }
  ```

- **A `data-highlight` written in an attribute block wins** (all engines), with the attrs plugin or Sätteri's `attributes` feature.

The VS Code extension shows the pills in the preview, in light and dark themes.

`@mirrordown/core` gains `createHighlightMarkers`, `HIGHLIGHT_MARKERS` and the `MarkOptions` type.
