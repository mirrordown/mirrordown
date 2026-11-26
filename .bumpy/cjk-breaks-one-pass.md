---
"@mirrordown/mdit-cjk-breaks": patch
---

The markdown-it plugin removes CJK line breaks in one pass over a paragraph's tokens.

- **About twice as fast on long paragraphs, with the same output.** The rule collected the breaks to remove and then filtered the token list; it now builds the list of kept tokens as it reads. Each break is still decided on the tokens as they came.

  ```markdown
  日
  日
  日
  ```

  Repeated to 640,000 lines, the rule took 396 ms and now takes about 200 ms. The HTML is the same: `<p>日日日…</p>`.
