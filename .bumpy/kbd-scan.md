---
"@mirrordown/core": minor
"@mirrordown/remd-kbd": patch
"@mirrordown/sat-kbd": minor
"@mirrordown/preset-satteri": minor
---

`[[key]]` now scans the same way in every engine. `@mirrordown/core`'s new `createKbdTransform` ports markdown-it-kbd's tokenizer, and `remd-kbd` and the new `@mirrordown/sat-kbd` run on it:

- Keys nest: `[[a [[b]] c]]`.
- A single `]` stays inside a key: `[[a]b]]`.
- A line ending before the closing `]]` cancels the key even when formatting sits in between.
- `[[[a]]` keeps the extra `[` outside the key.

`remd-kbd` drops its `unist-util-find-*` and `unist-builder` dependencies. One difference is inherent to the engines and documented in the guide: markdown-it reads `[[*a]]*` as a key, while remark and Sätteri have already read the emphasis.

`@mirrordown/sat-kbd` is included in `@mirrordown/preset-satteri`.
