---
"@mirrordown/mdit-file-tree": minor
"@mirrordown/remd-file-tree": minor
"@mirrordown/sat-file-tree": minor
"markdown-file-tree": minor
"@mirrordown/core": patch
---

Add the file-tree plugin set, a port of Vocs' File Tree that degrades gracefully: a ` ```filetree ` fence renders as a file tree laid out like VS Code's explorer, and stays a readable code block where the plugin isn't installed, such as on GitHub. Rows nest by indentation, or by the branches the `tree` command draws (Unicode or `--charset=ascii`), or by list markers. `name/` marks a folder and `name/…` one that starts closed; `#` or `//` starts a comment, `**name**` highlights a row, and `[A]` `[M]` `[D]` `[R]` `[U]` `[I]` mark git status. Files get Seti UI's icons and colors as inline SVG, which the `icons` option adds to or replaces. The `theme` option takes a Shiki or VS Code theme, or a light and dark pair, so trees match the code blocks around them; each color can also be set with a `--markdown-file-tree-*` custom property, and a color left out or given an invalid value falls back on its own. Each folder is a `<details>`, so trees open and close without JavaScript, and folder rows stick to the page as their contents scroll past; the optional client script makes each tree an ARIA tree, navigated with the arrow keys. The Markdown File Tree VS Code extension renders trees in the preview in the editor's theme. The markdown-it, remark and Sätteri plugins emit identical HTML.
