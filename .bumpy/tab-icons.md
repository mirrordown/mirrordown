---
"@mirrordown/mdit-tab-icons": minor
"@mirrordown/remd-tab-icons": minor
"@mirrordown/sat-tab-icons": minor
"markdown-tab-icons": minor
"@mirrordown/core": patch
---

Add the tab-icons plugin set, a port of vitepress-plugin-group-icons for Mirrordown's tabs: each tab label gets the icon its text matches (a keyword such as `npm`, `pnpm` or `vite` as a whole word, the longest winning, else a file name or extension such as `package.json` or `.ts`), or the one a `[!keyword]` marker at its start names; `[!none]` turns matching off for one label. The icon is an inline `<svg class="markdown-tab-icon" aria-hidden="true">` before the label's text, and the marker comes out of the label and its panel's `aria-label`. It ships group-icons' built-in icons (from VSCode Icons and SVG Logos); the `icons` option adds or replaces them, with light and dark pairs, and `builtin` and `match` turn the built-in icons and matching off. The markdown-it, remark and Sätteri plugins emit identical HTML.
