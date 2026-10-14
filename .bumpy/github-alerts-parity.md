---
"@mirrordown/mdit-github-alerts": minor
"@mirrordown/remd-github-alerts": minor
"markdown-github-alerts": minor
"markdown-preview-extended-syntax": patch
---

Make `mdit-github-alerts` and `remd-github-alerts` render identical HTML. `remd` no longer drops the first paragraph of an alert when its first line contains formatting or its body starts with formatting (for example `> [!NOTE]` followed by `> **Bold** text`, which lost the whole body). The marker line now works the same in both engines: everything after `[!TYPE]` on the first line is the title, inline formatting included (`> [!NOTE] *Emphasized* title`), with its plain text (including inline code) as the `aria-label`; everything after the first line break, soft or hard, is the body. The icon SVG is no longer wrapped in a redundant `<span aria-hidden>` (`remd`), and a foldable-open alert emits a bare `open` attribute instead of `open=""` (`mdit`).
