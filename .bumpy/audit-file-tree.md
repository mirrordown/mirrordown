---
"@mirrordown/mdit-file-tree": patch
"@mirrordown/remd-file-tree": patch
"@mirrordown/sat-file-tree": patch
---

Fixes for a file name that made a tree fail to render, and for the tree's reading speed and client script.

- **A file named `constructor` renders** (all engines).

  ````markdown
  ```filetree
  src/
    constructor
    toString
  ```
  ````

  Was a `TypeError` that failed the whole document. Now a tree with both files, each with the icon of an unknown file. The same goes for `__proto__`, `valueOf`, `hasOwnProperty` and a name ending in `.constructor`.

- **A very long line is read in time proportional to its length** (all engines). A row of a few tens of thousands of characters took seconds to read; the rows read are the same.

- **The client script gives a tree one set of listeners however many times it is loaded** (all engines). Loaded twice, one key press acted twice: `→` on a closed folder opened it and moved into it.

The guide now says that a comment after a placeholder row is dropped and that a longer built-in icon match wins over a custom extension icon.
