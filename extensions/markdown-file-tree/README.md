# Markdown File Tree

Renders filetree code blocks as file trees in VSCode's markdown preview, like the explorer: Seti icons, git status colors and folders that open and close, in the editor's theme.

## Overview

The `file-tree` plugin turns a ` ```filetree ` code fence into a file tree, laid out like VS Code's explorer: icons from [Seti](https://github.com/jesseweed/seti-ui), folders that open and close, comments, highlighted rows and git status. Where the plugin isn't installed, such as on GitHub, the fence stays a code block, and still reads as a tree.

````markdown
```filetree
.
├── src/
│   ├── components/
│   │   ├── Button.tsx [A]     # new
│   │   └── Card.tsx
│   ├── **index.ts** [M]       # the entry point
│   └── styles.css
├── node_modules/…
├── package.json
├── README.md
└── vite.config.ts

3 directories, 6 files
```
````

Each folder is a `<details>`, so the tree opens and closes without JavaScript, by mouse, keyboard and screen reader. An optional client script makes it an ARIA tree, navigated with the arrow keys.

## Syntax

Write one name per line. A row goes inside the nearest row above it whose name starts further left, so indent however you like:

````markdown
```filetree
docs/
  guide/
    getting-started.md
    plugins.md
  index.md
package.json
```
````

Or paste what the `tree` command prints. Its branches, with `--charset=ascii` or without, are read as indentation, and its first line (`.`) and its count at the end are left out. List markers (`-`, `*`) are fine too.

````markdown
```filetree
.
|-- docs/
|   |-- guide/
|   |   |-- getting-started.md
|   |   `-- plugins.md
|   `-- index.md
`-- package.json

2 directories, 4 files
```
````

### Folders

A row with rows inside it is a folder, and so is a row ending in `/`, which marks an empty one. A folder ending in `/…` (or `/...`) starts closed; one with nothing listed inside shows `…` when opened. A row can be a path, such as `src/lib/utils.ts`, for folders that hold only one thing.

````markdown
```filetree
src/lib/utils.ts
public/
dist/…
  index.js
  index.d.ts
node_modules/…
```
````

### Comments, highlights and placeholders

After a name, ` # ` or ` // ` starts a comment. `**name**` highlights a row. A row of `...` or `…` stands for entries left out.

````markdown
```filetree
src/
  **index.ts**      # start here
  router.ts         // maps URLs to pages
  ...
```
````

### Git status

A row's git status goes in brackets after its name, before any comment, with `git status`'s letters: `[A]` added, `[M]` modified, `[D]` deleted, `[R]` renamed, `[U]` untracked and `[I]` ignored. As in VS Code, the row takes the status's color with its letter at the end, and a folder holding changes gets a dot.

````markdown
```filetree
src/
  cache.ts [A]       # new
  index.ts [M]
  legacy.ts [D]
  router.ts [R]
  scratch.ts [U]
.env [I]
```
````

### Icons

Each file gets its icon and color from Seti's table, by its name (`README.md`, `Dockerfile`), its extension, or part of its name, as VS Code's Seti theme does.

````markdown
```filetree
.github/
Dockerfile
README.md
LICENSE
astro.config.mjs
index.html
main.go
lib.rs
app.py
logo.svg
photo.png
data.csv
archive.zip
tsconfig.json
vite.config.ts
yarn.lock
```
````

Hosts that highlight code before your plugins run, such as Astro with Shiki, must leave `filetree` fences alone:

```ts
// astro.config.ts
export default defineConfig({
  markdown: {
    syntaxHighlight: { type: "shiki", excludeLangs: ["filetree"] },
  },
});
```

## The client script

Without it, a tree is nested lists, and its folders open and close as `<details>` do. Import it once per page, from the package for your engine, to make each tree an [ARIA tree](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/): one tab stop, ↑ and ↓ between rows, → and ← to open and close folders or move into and out of them, Home and End, `*` to open a folder's siblings, and typing a name's first letters to jump to it.

```ts
import "@mirrordown/remd-file-tree/client";
```

## Styling

This extension ships default styles for the rendered output in the preview. To
customize them, point VSCode's `markdown.styles` setting at your own CSS file:

```jsonc
// .vscode/settings.json
{
  "markdown.styles": ["./my-preview-styles.css"]
}
```

## About

Part of **[Markdown Preview Extended Syntax](https://marketplace.visualstudio.com/items?itemName=saeris.markdown-preview-extended-syntax)** — a pack of Markdown preview syntax extensions you can install all at once.

Powered by [`@mirrordown/mdit-file-tree`](https://www.npmjs.com/package/@mirrordown/mdit-file-tree) · Source on [GitHub](https://github.com/mirrordown/mirrordown).
