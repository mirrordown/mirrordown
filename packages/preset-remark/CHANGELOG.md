# Changelog

## 0.1.0
<sub>2026-10-28</sub>

- *(minor)*
  New presets for adopting the whole suite in one call: `@mirrordown/preset-markdown-it` (`md.use(mirrordown, options)`) and `@mirrordown/preset-remark` (`mirrordown(options)`, which plugs into Astro's `unified()` processor or a unified pipeline). Every feature is on by default, `false` turns one off, and an options object configures it. Each preset also ships a stylesheet that imports every plugin's CSS.

  `mdit-autolink-headings` no longer adds an anchor to a heading whose id is empty (a heading with no text, such as one holding only an image): there is nothing to link to, and `remd-autolink-headings` already skipped it.
- *(patch)*
  Attrs run after the other remark plugins, as `mdit-attrs` does in markdown-it, so attributes on a step title (`@1. Step {.cls}`) or a tab label (`% Tab {.cls}`) reach the step or tab instead of being dropped.
- *(patch)*
  `remd-github-alerts` applies other plugins' `data` to a blockquote that isn't an alert, as remark-rehype's own handler does, so attributes on a blockquote (`> quote` then `{.note}`) are no longer dropped when alerts are on.
