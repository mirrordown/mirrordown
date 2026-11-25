---
"@mirrordown/core": minor
---

Core can say what a CJK character is, from tables pinned to one Unicode version. No plugin uses them yet, so no output changes.

- **New exports for classifying a code point**, as the [CommonMark CJK-friendly Amendments](https://github.com/tats-u/markdown-cjk-friendly/blob/main/specification.md) define the terms:

  ```ts
  import { isCjkCharacter, isEastAsianWide, isHangul } from "@mirrordown/core";

  isCjkCharacter(0x3002); // 。 true: wide, and not an emoji
  isCjkCharacter(0x1f389); // 🎉 false: wide, but an emoji by default
  isCjkCharacter(0xd55c); // 한 true: Hangul
  isEastAsianWide(0x1f389); // true: East Asian Width W, F or H
  isHangul(0xd55c); // true
  ```

  Also `isIdeographicVariationSelector`, `isNonEmojiVariationSelector`, `isCjkAmbiguousPunctuationSequence`, and `codePointBefore(text, index)`, which reads the code point that ends before an index without splitting a surrogate pair.

- **The answers come from Unicode 18.0.0, whatever the runtime ships.** A `\p{…}` expression answers with the Unicode version of the Node or browser running it, so the same document could render differently on two machines. These tables are generated from the Unicode Character Database by `scripts/generate-cjk-ranges.mjs` and checked in.
