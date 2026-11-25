---
"markdown-cjk-breaks": minor
"markdown-cjk-friendly": minor
"markdown-preview-extended-syntax": minor
---

Two new preview extensions, for the `cjk-breaks` and `cjk-friendly` plugins, and the pack includes them.

- **Markdown CJK Line Breaks** (`saeris.markdown-cjk-breaks`). A line break inside Chinese or Japanese text is removed in the preview, where it would show as a space.

  ```markdown
  吾輩は猫である。
  名前はまだ無い。
  ```

  Was, in the preview, `吾輩は猫である。 名前はまだ無い。`, with a space where the line ended. Now `吾輩は猫である。名前はまだ無い。`. Korean text, a break beside a Latin word, hard breaks and code are left as they are. With VS Code's `markdown.preview.breaks` setting on, every line break is a hard break, so the extension changes nothing.

- **Markdown CJK-Friendly Emphasis** (`saeris.markdown-cjk-friendly`). Emphasis, strikethrough and the pack's other inline elements open and close beside Chinese, Japanese and Korean punctuation.

  ```markdown
  **テスト。**テスト

  これは==「重要」==です
  ```

  Was text in the preview, asterisks and equals signs included. Now `<strong>テスト。</strong>テスト` and, with Markdown Mark installed, `これは<mark>「重要」</mark>です`. It works with the other extensions in whatever order VS Code loads them.

- **The pack lists both**, 30 extensions in all.
