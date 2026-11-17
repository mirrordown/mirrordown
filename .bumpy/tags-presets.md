---
"@mirrordown/preset-markdown-it": minor
"@mirrordown/preset-remark": minor
"@mirrordown/preset-satteri": minor
---

Add `tags`, on by default like every other feature: `#tag` in text becomes `<a class="tag" href="#tag">#tag</a>`. Pages rendered with a preset change where their text holds such a word.

- **A word that starts with `#` is now a link.**

  ```markdown
  Set the colour to #fff and see #todo below.
  ```

  Was plain text. Now `#fff` and `#todo` are tag links. A hash followed only by digits (`#1984`, `#000`), one inside a word (`abc#def`), and one in code or in a link are still text. Write `\#fff` to keep a single word as text, or pass `tags: false` to turn the feature off.

- **`tags: { href }` sets where a tag links to,** for a site with tag pages: `mirrordown({ tags: { href: (name) => "/tags/" + name } })`.
