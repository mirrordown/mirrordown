---
"@mirrordown/mdit-attrs": patch
"@mirrordown/remd-attrs": patch
---

The attrs plugins do less work per document. markdown-it's plugin now skips a rule as soon as the current token is not the type the rule anchors on, instead of running every rule's full test on every token; remark's plugin builds the source lines and the parent map that only a block on a line of its own needs when it first finds one, instead of on every document. Output is unchanged.
