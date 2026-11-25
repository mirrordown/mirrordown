---
"@mirrordown/mdit-cjk-breaks": minor
"@mirrordown/remd-cjk-breaks": minor
"@mirrordown/sat-cjk-breaks": minor
"@mirrordown/preset-markdown-it": minor
"@mirrordown/preset-remark": minor
"@mirrordown/preset-satteri": minor
"@mirrordown/core": minor
---

New plugin set `cjk-breaks`: a line break inside Chinese or Japanese text is no longer a space on the page. The presets turn it on by default.

- **New: `@mirrordown/mdit-cjk-breaks`, `@mirrordown/remd-cjk-breaks`, `@mirrordown/sat-cjk-breaks`.** Authors wrap long paragraphs in their editor, and a browser shows each line break as a space: right between Latin words, wrong in the middle of a sentence written without spaces. The plugins remove a soft line break when the characters on both sides have East Asian Width W, F or H and neither is Hangul, or when either is the zero-width space U+200B.

  ```markdown
  吾輩は猫である。
  名前はまだ無い。
  ```

  Was `<p>吾輩は猫である。⏎名前はまだ無い。</p>`, which a browser shows as `吾輩は猫である。 名前はまだ無い。`. Now `<p>吾輩は猫である。名前はまだ無い。</p>`.

  Korean, which puts spaces between words, keeps its breaks, and so does a break with a Latin word on either side:

  ```markdown
  한국어 문장은
  띄어쓰기를 합니다.

  日本語
  English
  ```

  Both render as before.

- **The character on each side is the one the reader sees.** Emphasis, links and the Mirrordown spans are read through, and a code span counts by its own content. An image, raw HTML or a hard break is not a character, so the break beside it stays.

  ```markdown
  **日本**
  **語**

  日本語`foo`
  日本語
  ```

  Now `<p><strong>日本</strong><strong>語</strong></p>` and, unchanged, `<p>日本語<code>foo</code>⏎日本語</p>`. This differs from `markdown-it-cjk-breaks`, which looks for the nearest text on each side and steps over what lies between: it removes the second break, joining `foo` to `日本語`.

- **Presets: `cjkBreaks`, on by default.** All three presets remove CJK breaks, after every plugin that reads lines, so tabs, steps, alerts, captions and the rest find their syntax first. A document with no soft break between two wide characters renders byte for byte as before. Turn it off with `cjkBreaks: false`.

- **`@mirrordown/core`** exports `cjkBreakRemoved`, the rule the three plugins share, and `removeCjkBreaks`, the mdast transform behind the remark and Sätteri plugins.
