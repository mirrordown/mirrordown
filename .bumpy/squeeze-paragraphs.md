---
"@mirrordown/mdit-squeeze-paragraphs": minor
"@mirrordown/remd-squeeze-paragraphs": minor
"markdown-squeeze-paragraphs": minor
"markdown-preview-extended-syntax": patch
---

Add the squeeze-paragraphs plugin set: removes empty (whitespace-only) paragraphs — those with no children or only whitespace text. CommonMark never emits an empty paragraph on its own, so this is a cleanup pass for residue left by other transforms (e.g. a comment stripper, or a plugin that lifts an element out of its wrapping paragraph); place it last in the pipeline to tidy that residue. The markdown-it and remark plugins emit identical HTML. Also bundles the `markdown-squeeze-paragraphs` VSCode preview extension in the extension pack.
