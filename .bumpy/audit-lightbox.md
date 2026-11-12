---
"@mirrordown/mdit-lightbox": patch
"@mirrordown/remd-lightbox": patch
"@mirrordown/sat-lightbox": patch
---

A caption that renders nothing no longer leaves an empty `<p>` in the dialog. An id written by hand that is already taken falls back to the generated one, so the dialog stays reachable, and two ids on one image give two dialogs. markdown-it escapes the id it writes, and with `caption: true` a lightbox image inside a caption is a trigger in every engine.
