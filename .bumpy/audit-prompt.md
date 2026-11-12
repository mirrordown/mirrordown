---
"@mirrordown/mdit-prompt": patch
"@mirrordown/remd-prompt": patch
"@mirrordown/sat-prompt": patch
---

A prompt holding `$$` or `$&` is sent to the service as written. In markdown-it a link reference definition no longer crosses between a prompt and the page. The client script does nothing when loaded a second time.
