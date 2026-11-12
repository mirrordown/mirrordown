---
"@mirrordown/mdit-file-tree": patch
"@mirrordown/remd-file-tree": patch
"@mirrordown/sat-file-tree": patch
---

A file named `constructor`, `toString` or `__proto__` no longer makes the tree throw. Very long lines are read in time proportional to their length, and the client script gives a tree one set of listeners however many times it is loaded.
