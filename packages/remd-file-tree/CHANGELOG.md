# Changelog




## 0.1.3
<sub>2026-11-26</sub>

- *(patch)* Updated dependency `@mirrordown/core` v0.4.0

## 0.1.2
<sub>2026-11-24</sub>

- *(patch)* Updated dependency `@mirrordown/core` v0.3.0

## 0.1.1
<sub>2026-11-17</sub>

- *(patch)*
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

## 0.1.0
<sub>2026-11-03</sub>

- *(minor)*
  Add the file-tree plugin set, a port of Vocs' File Tree that degrades gracefully: a ` ```filetree ` fence renders as a file tree laid out like VS Code's explorer, and stays a readable code block where the plugin isn't installed, such as on GitHub. Rows nest by indentation, or by the branches the `tree` command draws (Unicode or `--charset=ascii`), or by list markers. `name/` marks a folder and `name/…` one that starts closed; `#` or `//` starts a comment, `**name**` highlights a row, and `[A]` `[M]` `[D]` `[R]` `[U]` `[I]` mark git status. Files get Seti UI's icons and colors as inline SVG, which the `icons` option adds to or replaces. The `theme` option takes a Shiki or VS Code theme, or a light and dark pair, so trees match the code blocks around them; each color can also be set with a `--markdown-file-tree-*` custom property, and a color left out or given an invalid value falls back on its own. Each folder is a `<details>`, so trees open and close without JavaScript, and folder rows stick to the page as their contents scroll past; the optional client script makes each tree an ARIA tree, navigated with the arrow keys. The Markdown File Tree VS Code extension renders trees in the preview in the editor's theme. The markdown-it, remark and Sätteri plugins emit identical HTML.
