---
"@mirrordown/preset-remark": patch
---

Attrs run after the other remark plugins, as `mdit-attrs` does in markdown-it, so attributes on a step title (`@1. Step {.cls}`) or a tab label (`% Tab {.cls}`) reach the step or tab instead of being dropped.
