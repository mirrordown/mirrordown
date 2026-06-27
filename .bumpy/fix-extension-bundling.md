---
"markdown-abbr": patch
"markdown-attributes": patch
"markdown-definition-list": patch
"markdown-del": patch
"markdown-denden-furigana": patch
"markdown-github-alerts": patch
"markdown-ins": patch
"markdown-keyboard": patch
"markdown-mark": patch
"markdown-steps": patch
"markdown-subscript": patch
"markdown-superscript": patch
"markdown-tabs": patch
"markdown-unwrap-images": patch
---

Fix broken syntax rendering: the published 0.1.1 vsix files externalized the
bundled markdown-it plugin (a bare `require("@mirrordown/mdit-*")` that isn't in
the vsix), so no extension actually loaded its plugin. Force-bundle the plugin
via `pack.deps.alwaysBundle`, and build the plugin packages before the
extensions in CI so there is a dist to bundle.
