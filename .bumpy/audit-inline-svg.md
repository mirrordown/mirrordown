---
"@mirrordown/mdit-inline-svg": patch
"@mirrordown/remd-inline-svg": patch
"@mirrordown/sat-inline-svg": patch
---

Alt text is inserted as written, so `![Price: $1](x.svg)` no longer breaks the `<svg>` tag, and a self-closing root gets a proper closing tag. A missing or unparseable file, or a malformed percent-escape in the path, leaves the `<img>` in every engine instead of throwing. The engines resolve the same path for the same `src`, root attributes survive deduplication, two inlined SVGs no longer share ids, and an edited file is read again. The READMEs state the trust model.
