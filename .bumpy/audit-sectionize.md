---
"@mirrordown/mdit-sectionize": patch
"@mirrordown/remd-sectionize": patch
"@mirrordown/sat-sectionize": patch
---

One fix, which changes the output of documents where a deeper heading comes before a shallower one that is not its parent: a document that opens with `####` before its first `##`, or `# A`, `#### D`, `## B`. Documents whose headings follow outline order (`#`, `##`, `###`, back to `##`) render as before.

- **A heading that comes before a shallower one gets its own section** (all engines).

  ```markdown
  #### Deep

  text

  ## Shallow

  body
  ```

  Was `<h4>Deep</h4><p>text</p>` left bare, followed by `<section data-depth="2">…</section>`. Now `<section data-depth="4"><h4>Deep</h4><p>text</p></section>` followed by the same section.

- **The same inside another section** (all engines).

  ```markdown
  # A

  #### D

  d

  ## B

  b
  ```

  Was `<h4>D</h4><p>d</p>` bare inside A's section. Now `<section data-depth="4">` around them, closed before B's section opens.
