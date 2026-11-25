---
"@mirrordown/remd-cjk-friendly": patch
"@mirrordown/remd-sub": patch
"@mirrordown/remd-sup": patch
"@mirrordown/core": patch
---

remark reads a character outside the Basic Multilingual Plane beside a delimiter run as the whole character it is, as markdown-it and Sätteri do.

- **An emoji or a symbol beside `*`, `_` or `~~` is punctuation in remark, with `remd-cjk-friendly`.** micromark classifies the character beside a run one code unit at a time, and a character outside the BMP is two, so it took every emoji and mathematical symbol for a letter. CommonMark counts symbols as punctuation, and markdown-it and Sätteri read them so.

  ```markdown
  🎉**"a"**

  a**a𝜵**a
  ```

  Was, in remark, `<p>🎉**"a"**</p>` and `<p>a<strong>a𝜵</strong>a</p>`. Now `<p>🎉<strong>"a"</strong></p>` and `<p>a**a𝜵**a</p>`, as markdown-it and Sätteri render them. The remark preset has the plugin on by default; without it, remark's emphasis is micromark's own and reads as before.

- **`remd-sub` and `remd-sup` read it the same way, with or without other plugins**, as `mdit-sub` and `mdit-sup` do.

  ```markdown
  🎉~"a"~

  a^a𝜵^a
  ```

  Was `<p>🎉~"a"~</p>` and `<p>a<sup>a𝜵</sup>a</p>`. Now `<p>🎉<sub>"a"</sub></p>` and `<p>a^a𝜵^a</p>`.

- **Half a surrogate pair beside a run is read as U+FFFD**, a symbol, which is what markdown-it reads in its place.

- A letter outside the BMP, such as `𠮷`, is a letter as before, and so is every character inside it.
