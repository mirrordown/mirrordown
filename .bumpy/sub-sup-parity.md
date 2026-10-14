---
"@mirrordown/core": minor
"@mirrordown/mdit-sub": minor
"@mirrordown/mdit-sup": minor
"@mirrordown/remd-sub": minor
"@mirrordown/remd-sup": minor
"markdown-sub": minor
"markdown-sup": minor
---

`~subscript~` and `^superscript^` now parse the same way in markdown-it, remark and Sätteri: a single `~` or `^` is a delimiter run with emphasis-style flanking, its content is inline markup (spaces, emphasis, links, code and each other), and crossing runs resolve leftmost-first.

- `mdit-sub` and `mdit-sup` used to keep the content as plain text and reject any space inside it. They now parse it as inline markup, so `~*a* b~` renders emphasis and `^a~b~c^` nests.
- `remd-sub` and `remd-sup` are now micromark syntax extensions sharing one resolver from `@mirrordown/core` (`scriptSyntax`), instead of text scans run one after another. Crossing runs such as `^a~b^c~` no longer depend on which plugin was registered first, `~~a~~` without GFM is no longer turned into empty subscripts, and the packages drop their `unist-util-*` dependencies.
- The sub guide now shows `remark-gfm` with `singleTilde: false`: GFM's single-tilde strikethrough, which Astro enables by default, otherwise claims `~text~` first.
