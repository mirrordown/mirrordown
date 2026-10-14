---
"@mirrordown/mdit-tabs": minor
"@mirrordown/remd-tabs": minor
"markdown-tabs": minor
"markdown-preview-extended-syntax": patch
---

Make `mdit-tabs` and `remd-tabs` render identical HTML. `remd-tabs` no longer drops a depth-skipping header line (`% Tab One` followed by `%%% Too Deep`) and pulls the following content into the previous tab: the skipped-depth line now ends the group and renders as an ordinary paragraph, as in `mdit-tabs`. `remd-tabs` also splits a tab header that a nested blockquote lazily absorbed (`> > quote` followed by `% Tab Two`), which previously merged the next tab into the quote. `mdit-tabs` now emits the radio inputs' `hidden` and `checked` attributes bare, as `remd-tabs` does, instead of `hidden=""` and `checked=""`.
