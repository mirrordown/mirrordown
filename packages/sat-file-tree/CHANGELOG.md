# Changelog


## 0.2.0
<sub>2026-11-11</sub>

- *(minor)*
  Require Sätteri 0.11.3 or later, which Astro ships from 7.4.7 (`@astrojs/markdown-satteri` 0.4.7). The plugins now read the document's features from Sätteri itself, so in Astro `satteriRuby()` needs no `features` passed to it, and tabs and steps no longer allow for a Sätteri that passes none. On Astro 7.4.6 or earlier, update Astro first.

## 0.1.0
<sub>2026-11-03</sub>

- *(minor)*
  Add the file-tree plugin set, a port of Vocs' File Tree that degrades gracefully: a ` ```filetree ` fence renders as a file tree laid out like VS Code's explorer, and stays a readable code block where the plugin isn't installed, such as on GitHub. Rows nest by indentation, or by the branches the `tree` command draws (Unicode or `--charset=ascii`), or by list markers. `name/` marks a folder and `name/…` one that starts closed; `#` or `//` starts a comment, `**name**` highlights a row, and `[A]` `[M]` `[D]` `[R]` `[U]` `[I]` mark git status. Files get Seti UI's icons and colors as inline SVG, which the `icons` option adds to or replaces. The `theme` option takes a Shiki or VS Code theme, or a light and dark pair, so trees match the code blocks around them; each color can also be set with a `--markdown-file-tree-*` custom property, and a color left out or given an invalid value falls back on its own. Each folder is a `<details>`, so trees open and close without JavaScript, and folder rows stick to the page as their contents scroll past; the optional client script makes each tree an ARIA tree, navigated with the arrow keys. The Markdown File Tree VS Code extension renders trees in the preview in the editor's theme. The markdown-it, remark and Sätteri plugins emit identical HTML.
