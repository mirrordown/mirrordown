---
"@mirrordown/remd-slug": minor
"@mirrordown/mdit-slug": minor
---

Add the `slug` plugin set: rehype and markdown-it plugins that add GitHub-style `id` slugs to headings (via `github-slugger`), so headings can be linked to. Both engines emit identical ids, repeated headings de-duplicate with a numeric suffix, and headings that already have an `id` (e.g. from `attrs`) are preserved.
