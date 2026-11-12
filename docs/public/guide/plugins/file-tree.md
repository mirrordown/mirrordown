---
title: file-tree
description: "Renders file trees from filetree code fences, with Seti icons, git status and collapsible folders, that read as plain text where the plugin isn't installed."
---

<style>
  @import url("../../markdown.css");
</style>

## Overview

The `file-tree` plugin turns a ` ```filetree ` code fence into a file tree, laid out like VS Code's explorer: icons from [Seti](https://github.com/jesseweed/seti-ui), folders that open and close, comments, highlighted rows and git status. Where the plugin isn't installed, such as on GitHub, the fence stays a code block, and still reads as a tree.

% Demo
> ```filetree
> .
> ├── src/
> │   ├── components/
> │   │   ├── Button.tsx [A]     # new
> │   │   └── Card.tsx
> │   ├── **index.ts** [M]       # the entry point
> │   └── styles.css
> ├── node_modules/…
> ├── package.json
> ├── README.md
> └── vite.config.ts
>
> 3 directories, 6 files
> ```
>
% Code
> ````markdown
> ```filetree
> .
> ├── src/
> │   ├── components/
> │   │   ├── Button.tsx [A]     # new
> │   │   └── Card.tsx
> │   ├── **index.ts** [M]       # the entry point
> │   └── styles.css
> ├── node_modules/…
> ├── package.json
> ├── README.md
> └── vite.config.ts
>
> 3 directories, 6 files
> ```
> ````

Each folder is a `<details>`, so the tree opens and closes without JavaScript, by mouse, keyboard and screen reader. An optional client script makes it an ARIA tree, navigated with the arrow keys.

## Syntax

Write one name per line. A row goes inside the nearest row above it whose name starts further left, so indent however you like:

% Demo
> ```filetree
> docs/
>   guide/
>     getting-started.md
>     plugins.md
>   index.md
> package.json
> ```
>
% Code
> ````markdown
> ```filetree
> docs/
>   guide/
>     getting-started.md
>     plugins.md
>   index.md
> package.json
> ```
> ````

Or paste what the `tree` command prints. Its branches, with `--charset=ascii` or without, are read as indentation, and its first line (`.`) and its count at the end are left out. List markers (`-`, `*`) are fine too.

% Demo
> ```filetree
> .
> |-- docs/
> |   |-- guide/
> |   |   |-- getting-started.md
> |   |   `-- plugins.md
> |   `-- index.md
> `-- package.json
>
> 2 directories, 4 files
> ```
>
% Code
> ````markdown
> ```filetree
> .
> |-- docs/
> |   |-- guide/
> |   |   |-- getting-started.md
> |   |   `-- plugins.md
> |   `-- index.md
> `-- package.json
>
> 2 directories, 4 files
> ```
> ````

### Folders

A row with rows inside it is a folder, and so is a row ending in `/`, which marks an empty one. A folder ending in `/…` (or `/...`) starts closed; one with nothing listed inside shows `…` when opened. A row can be a path, such as `src/lib/utils.ts`, for folders that hold only one thing.

% Demo
> ```filetree
> src/lib/utils.ts
> public/
> dist/…
>   index.js
>   index.d.ts
> node_modules/…
> ```
>
% Code
> ````markdown
> ```filetree
> src/lib/utils.ts
> public/
> dist/…
>   index.js
>   index.d.ts
> node_modules/…
> ```
> ````

### Comments, highlights and placeholders

After a name, ` # ` or ` // ` starts a comment. `**name**` highlights a row. A row of `...` or `…` stands for entries left out; a comment written after one is dropped.

% Demo
> ```filetree
> src/
>   **index.ts**      # start here
>   router.ts         // maps URLs to pages
>   ...
> ```
>
% Code
> ````markdown
> ```filetree
> src/
>   **index.ts**      # start here
>   router.ts         // maps URLs to pages
>   ...
> ```
> ````

### Git status

A row's git status goes in brackets after its name, before any comment, with `git status`'s letters: `[A]` added, `[M]` modified, `[D]` deleted, `[R]` renamed, `[U]` untracked and `[I]` ignored. As in VS Code, the row takes the status's color with its letter at the end, and a folder holding changes gets a dot.

% Demo
> ```filetree
> src/
>   cache.ts [A]       # new
>   index.ts [M]
>   legacy.ts [D]
>   router.ts [R]
>   scratch.ts [U]
> .env [I]
> ```
>
% Code
> ````markdown
> ```filetree
> src/
>   cache.ts [A]       # new
>   index.ts [M]
>   legacy.ts [D]
>   router.ts [R]
>   scratch.ts [U]
> .env [I]
> ```
> ````

### Icons

Each file gets its icon and color from Seti's table, by its name (`README.md`, `Dockerfile`), its extension, or part of its name, as VS Code's Seti theme does.

% Demo
> ```filetree
> .github/
> Dockerfile
> README.md
> LICENSE
> astro.config.mjs
> index.html
> main.go
> lib.rs
> app.py
> logo.svg
> photo.png
> data.csv
> archive.zip
> tsconfig.json
> vite.config.ts
> yarn.lock
> ```
>
% Code
> ````markdown
> ```filetree
> .github/
> Dockerfile
> README.md
> LICENSE
> astro.config.mjs
> index.html
> main.go
> lib.rs
> app.py
> logo.svg
> photo.png
> data.csv
> archive.zip
> tsconfig.json
> vite.config.ts
> yarn.lock
> ```
> ````

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

Without it, a tree is nested lists, and its folders open and close as `<details>` do. Import it once per page, from the package for your engine (a second copy leaves the trees the first one set up as they are), to make each tree an [ARIA tree](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/): one tab stop, ↑ and ↓ between rows, → and ← to open and close folders or move into and out of them, Home and End, `*` to open a folder's siblings, and typing a name's first letters to jump to it.

```ts
import "@mirrordown/remd-file-tree/client";
```

## Configuration

All options are passed when registering the plugin, or as the presets' `fileTree` option.

### Theme

`theme` takes a Shiki or VS Code theme, so trees match your code blocks: their background and text from the editor's colors, rows and git colors from the explorer's, and comments from the theme's comment color. Pass a light and a dark theme, as Shiki's `themes` takes them, to follow the page's `color-scheme`. Without a theme, the stylesheet's own colors apply. In VSCode's Markdown preview, with the Markdown File Tree extension, trees take the editor's theme on their own.

% Remark
> ```ts
> import githubLight from "@shikijs/themes/github-light";
> import githubDark from "@shikijs/themes/github-dark";
>
> rehypeFileTree({ theme: { light: githubLight, dark: githubDark } })
> ```
% Markdown-It
> ```ts
> import githubDark from "@shikijs/themes/github-dark";
>
> md.use(fileTree, { theme: githubDark })
> ```
% Sätteri
> ```ts
> import githubDark from "@shikijs/themes/github-dark";
>
> satteriFileTree({ theme: githubDark })
> ```

### Icons

`icons` sets icons, as SVG markup, used before Seti's: `folder` for every folder, `file` for files nothing else matches, and `names` and `extensions` for files by name and extension (without its dot). A longer match of Seti's still wins: with your own `ts` icon, `a.test.ts` keeps Seti's icon for `test.ts`. The stylesheet sizes them to `1rem` and fills them with `currentColor`.

% Remark
> ```ts
> rehypeFileTree({ icons: { extensions: { astro: `<svg viewBox="0 0 24 24">...</svg>` } } })
> ```
% Markdown-It
> ```ts
> md.use(fileTree, { icons: { extensions: { astro: `<svg viewBox="0 0 24 24">...</svg>` } } })
> ```
% Sätteri
> ```ts
> satteriFileTree({ icons: { extensions: { astro: `<svg viewBox="0 0 24 24">...</svg>` } } })
> ```

## Accessibility

Without the client script, a tree is nested lists: screen readers announce each list's size and each row's place in it, and each folder's row is a `<summary>`, announced as expanded or collapsed. Icons are `aria-hidden`. With the script, the tree is an ARIA tree: the folder rows' `<summary>` elements leave the tab order, and each item announces its level, its place among its siblings and, for a folder, whether it's open. The tree is labeled "Files"; give it your own label with an attribute block on the fence, such as `{aria-label="Project files"}`.

## Customization

The stylesheet keeps its rules in `@layer markdown-file-tree`, so any unlayered CSS you write overrides them. Each color comes from, in order: a custom property you set on the tree or any ancestor, the theme you passed, or the stylesheet's default. Each color falls back on its own, so you can set only some, and a value that isn't a color is ignored: the color falls back as if it weren't set. Colors can be written in any CSS notation, `oklch()` included, in your custom properties and in a theme alike.

```css
.content {
  --markdown-file-tree-background: oklch(0.2 0 none);
  --markdown-file-tree-hover: oklch(0.6 0.15 250 / 0.15);
  --markdown-file-tree-modified: oklch(0.75 0.12 80);
}
```

The colors are `background`, `foreground`, `hover`, `highlight`, `highlight-foreground`, `guide`, `comment`, `focus`, and the git colors `added`, `modified`, `deleted`, `renamed`, `untracked` and `ignored`. Seti's icon colors are `--markdown-file-tree-blue`, `-green`, `-orange`, `-pink`, `-purple`, `-red`, `-yellow`, `-grey`, `-grey-light`, `-white`, `-ignore` and `-seti-primary`.

A folder's row sticks to the top of the page while its contents scroll past, under its parent folders' rows. If your page has a fixed header, set `--markdown-file-tree-sticky-offset` to its height, so the rows stick below it.

## Usage

% Remark
> The remark package ships `rehypeFileTree`, a rehype plugin: register it after `remark-rehype`, and before copy-code. It replaces each fence with the tree as a `raw` node, so it reaches the HTML exactly as the other engines write it; stringify with `allowDangerousHtml: true` (Astro already does).
>
> ```sh
> npm install @mirrordown/remd-file-tree
> ```
%% Unified
> ```ts
> import { unified } from "unified";
> import remarkParse from "remark-parse";
> import remarkRehype from "remark-rehype";
> import rehypeStringify from "rehype-stringify";
> import { rehypeFileTree } from "@mirrordown/remd-file-tree";
>
> const processor = unified()
>   .use(remarkParse)
>   .use(remarkRehype)
>   .use(rehypeFileTree)
>   .use(rehypeStringify, { allowDangerousHtml: true });
>
> // In the page:
> import "@mirrordown/remd-file-tree/file-tree.css";
> import "@mirrordown/remd-file-tree/client";
> ```
%% Astro
> ```ts
> // astro.config.ts
> import { defineConfig } from "astro/config";
> import { rehypeFileTree } from "@mirrordown/remd-file-tree";
>
> export default defineConfig({
>   markdown: {
>     syntaxHighlight: { type: "shiki", excludeLangs: ["filetree"] },
>     rehypePlugins: [rehypeFileTree],
>   },
> });
> ```
>
> ```astro
> ---
> // In your layout:
> import "@mirrordown/remd-file-tree/file-tree.css";
> ---
>
> <script>
>   import "@mirrordown/remd-file-tree/client";
> </script>
> ```
% Markdown-It
> ```sh
> npm install @mirrordown/mdit-file-tree
> ```
%% Standalone
> ```ts
> import MarkdownIt from "markdown-it";
> import { fileTree } from "@mirrordown/mdit-file-tree";
>
> const md = new MarkdownIt().use(fileTree);
>
> // In the page:
> import "@mirrordown/mdit-file-tree/styles";
> import "@mirrordown/mdit-file-tree/client";
> ```
%% VitePress
> ```ts
> // .vitepress/config.ts
> import { defineConfig } from "vitepress";
> import { fileTree } from "@mirrordown/mdit-file-tree";
>
> export default defineConfig({
>   markdown: {
>     config: (md) => {
>       md.use(fileTree);
>     },
>   },
> });
> ```
>
> ```ts
> // .vitepress/theme/index.ts
> import DefaultTheme from "vitepress/theme";
> import "@mirrordown/mdit-file-tree/styles";
>
> export default {
>   extends: DefaultTheme,
>   enhanceApp() {
>     if (typeof window !== "undefined") import("@mirrordown/mdit-file-tree/client");
>   },
> };
> ```
% Sätteri
> ```sh
> npm install @mirrordown/sat-file-tree
> ```
>
> List it before copy-code.
%% Standalone
> ```ts
> import { markdownToHtml } from "satteri";
> import { satteriFileTree } from "@mirrordown/sat-file-tree";
>
> const { html } = markdownToHtml(source, {
>   hastPlugins: [satteriFileTree()],
> });
>
> // In the page:
> import "@mirrordown/sat-file-tree/file-tree.css";
> import "@mirrordown/sat-file-tree/client";
> ```
%% Astro
> ```ts
> // astro.config.ts
> import { defineConfig } from "astro/config";
> import { satteri } from "@astrojs/markdown-satteri";
> import { satteriFileTree } from "@mirrordown/sat-file-tree";
>
> export default defineConfig({
>   markdown: {
>     syntaxHighlight: { type: "shiki", excludeLangs: ["filetree"] },
>     processor: satteri({ hastPlugins: [satteriFileTree()] }),
>   },
> });
> ```
>
> ```astro
> ---
> // In your layout:
> import "@mirrordown/sat-file-tree/file-tree.css";
> ---
>
> <script>
>   import "@mirrordown/sat-file-tree/client";
> </script>
> ```
