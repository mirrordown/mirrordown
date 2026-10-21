---
"@mirrordown/core": patch
"@mirrordown/remd-tabs": patch
"@mirrordown/remd-steps": patch
"@mirrordown/sat-tabs": patch
"@mirrordown/sat-steps": patch
"@mirrordown/mdit-tabs": patch
"@mirrordown/mdit-steps": patch
"markdown-tabs": patch
"markdown-steps": patch
"markdown-preview-extended-syntax": patch
---

Paragraphs in tab panels and step bodies keep what they had when recognition splits them around a header:

- A hard break (`line\` then `more`) stays a `<br>` in `remd-tabs`, `remd-steps`, `sat-tabs` and `sat-steps`; it became a plain line break, unlike in `mdit-tabs` and `mdit-steps`.
- Text split around a header keeps its source position, and the lines left together are one text node again, as remark gives them.
- In `sat-tabs` and `sat-steps`, a paragraph keeps the attributes Sätteri read from its end. A header right after a panel's last paragraph continues that paragraph in CommonMark, so Sätteri saw the paragraph's attribute block mid-paragraph; with Sätteri's `attributes` feature on, the plugins now place that block once the header is split off, where Sätteri would have.
- `mdit-tabs` and `mdit-steps` give the panel's opening token its body as `meta.attrsSource`, since the tokens inside index the body's lines, so `mdit-attrs` can read a line's indentation there.
