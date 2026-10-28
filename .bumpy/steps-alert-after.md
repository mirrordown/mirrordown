---
"@mirrordown/mdit-steps": patch
"@mirrordown/remd-steps": patch
"@mirrordown/sat-steps": patch
"@mirrordown/core": patch
---

An alert (`> [!NOTE]`) after a step, with a blank line between, is now a block of its own after the steps in every engine, whether or not the alerts plugin reads it. A plain quote there still continues the last step's body. markdown-it took the alert into the body as text, and remark into the body without its title.
