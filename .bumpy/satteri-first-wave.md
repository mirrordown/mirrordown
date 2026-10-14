---
"@mirrordown/sat-slug": minor
"@mirrordown/sat-github-alerts": minor
"@mirrordown/sat-mark": minor
"@mirrordown/preset-satteri": minor
---

First Sätteri plugins, for Astro 7's default markdown processor, rendering the same HTML as the markdown-it and remark plugins:

- `@mirrordown/sat-slug`: heading ids, shared slugging with `mdit-slug` and `remd-slug`.
- `@mirrordown/sat-github-alerts`: GitHub-style alerts, with the alert logic shared through `@mirrordown/core`, and the same stylesheet as the other engines.
- `@mirrordown/sat-mark`: `==highlight==`, using the same scan as `remd-mark` from `@mirrordown/core`.
- `@mirrordown/preset-satteri`: the Sätteri suite in one call, `markdownToHtml(source, mirrordown())` or Astro's `satteri(mirrordown())`, with Sätteri's built-in subscript and superscript turned on and smart punctuation off.
