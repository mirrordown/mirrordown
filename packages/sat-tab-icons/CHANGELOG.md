# Changelog


## 0.2.0
<sub>2026-11-11</sub>

- *(minor)*
  Require Sätteri 0.11.3 or later, which Astro ships from 7.4.7 (`@astrojs/markdown-satteri` 0.4.7). The plugins now read the document's features from Sätteri itself, so in Astro `satteriRuby()` needs no `features` passed to it, and tabs and steps no longer allow for a Sätteri that passes none. On Astro 7.4.6 or earlier, update Astro first.

## 0.1.0
<sub>2026-10-28</sub>

- *(minor)*
  Add the tab-icons plugin set, a port of vitepress-plugin-group-icons for Mirrordown's tabs: each tab label gets the icon its text matches (a keyword such as `npm`, `pnpm` or `vite` as a whole word, the longest winning, else a file name or extension such as `package.json` or `.ts`), or the one a `[!keyword]` marker at its start names; `[!none]` turns matching off for one label. The icon is an inline `<svg class="markdown-tab-icon" aria-hidden="true">` before the label's text, and the marker comes out of the label and its panel's `aria-label`. It ships group-icons' built-in icons (from VSCode Icons and SVG Logos); the `icons` option adds or replaces them, with light and dark pairs, and `builtin` and `match` turn the built-in icons and matching off. The markdown-it, remark and Sätteri plugins emit identical HTML.
