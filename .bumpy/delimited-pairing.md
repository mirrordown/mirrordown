---
"@mirrordown/core": minor
"@mirrordown/remd-mark": patch
"@mirrordown/remd-ins": patch
"@mirrordown/remd-del": patch
"@mirrordown/mdit-del": patch
"markdown-del": patch
"@mirrordown/sat-ins": minor
"@mirrordown/sat-del": minor
"@mirrordown/sat-mark": minor
"@mirrordown/preset-satteri": minor
---

`==mark==`, `++ins++` and `--del--` now pair delimiters the same way in every engine. `@mirrordown/core`'s `createDelimitedTransform` ports markdown-it's delimiter algorithm (the one markdown-it-mark and markdown-it-ins use), and the remark and Sätteri plugins run on it:

- A closer pairs with the nearest opener: `==a ==b==` highlights only `b`, as markdown-it does.
- Spans nest: `==a ==b== c==` is a highlight inside a highlight.
- The extra marker of an odd-length run stays outside the span (`===a===` → `=<mark>a</mark>=`); `mdit-del` compared against `+` instead of `-` here, so its marker ended up inside.
- `remd-del` no longer mishandles runs such as `--a --- b--` or `--+a+--`, which came from patterns copied from the ins plugin.

New Sätteri plugins `@mirrordown/sat-ins` and `@mirrordown/sat-del`, also included in `@mirrordown/preset-satteri`. The `del` guide notes that smart punctuation, on by default in Astro, turns `--` into an en dash before the plugin runs.
