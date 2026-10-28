# Markdown Tab Icons

Adds icons to tab labels in VSCode's markdown preview, matched from the label (npm, pnpm, vite.config.ts) or named with a [!keyword] marker.

## Overview

The `tab-icons` plugin adds an icon to the labels of [tab groups](/guide/plugins/tabs). A label gets the icon its text matches (`npm`, `pnpm`, `vite.config.ts`), or the one a `[!keyword]` marker at its start names. The icon is an inline `<svg>` before the label's text:

```html
<label class="markdown-tabs-label">
  <input type="radio" name="..." checked>
  <svg class="markdown-tab-icon" aria-hidden="true" viewBox="0 0 32 32">...</svg>
  npm
</label>
```

It's a port of [vitepress-plugin-group-icons](https://github.com/yuyinws/vitepress-plugin-group-icons), which does the same for VitePress code groups, with its matching rules and its built-in icons. The icons come from [VSCode Icons](https://github.com/vscode-icons/vscode-icons) (MIT) and [SVG Logos](https://github.com/gilbarbara/logos) (CC0). In renderers without the plugin, a label's text matches nothing, and a marker stays a line of text.

## Syntax

### Matching a label

Write the tool or file the tab is about as its label. Package managers, runtimes, frameworks and build tools match by name:

````markdown
% npm
> ```sh
> npm install @mirrordown/remd-tabs
> ```
% pnpm
> ```sh
> pnpm add @mirrordown/remd-tabs
> ```
% yarn
> ```sh
> yarn add @mirrordown/remd-tabs
> ```
% bun
> ```sh
> bun add @mirrordown/remd-tabs
> ```
````

File names match by name, then by extension:

````markdown
% vite.config.ts
> ```ts
> export default defineConfig({});
> ```
% package.json
> ```json
> { "type": "module" }
> ```
% .env.local
> ```sh
> API_URL=http://localhost:3000
> ```
% main.rs
> ```rs
> fn main() {}
> ```
````

### Naming the icon

Start a label with `[!keyword]` to choose its icon, the way a [GitHub alert](/guide/plugins/github-alerts) names its type. The marker comes out of the label; the keyword is any built-in or configured icon's key, in any case, including extensions such as `[!.ts]`. A label that is only a marker reads as its keyword.

````markdown
% [!npm] Install
> ```sh
> npm install @mirrordown/remd-tabs
> ```
% [!.ts] Configure
> ```ts
> export default { tabs: true };
> ```
% [!vite]
> ```sh
> vite build
> ```
````

`[!none]` turns matching off for one label. A keyword that names no icon isn't a marker: `[!foo] Install` stays as written.

## How a label is matched

Without a marker, the label's text is matched in this order, ignoring case:

1. **A keyword**, as a whole word: `vite` matches `Vite 8` and `vite.config.ts`, but not `invite`. A keyword may run into a `js`, `rc` or `ignore` suffix (`eslintrc`), and a camelCase label is split into words first, so `VitePress` matches `vite`.
2. **A file name or extension** the label ends with, `.ts` in `main.ts`; else one inside it, `.env` in `.env.local`.

When several keywords match, the **longest** wins, wherever it is in the label: `npm or pnpm` and `pnpm or npm` both get pnpm's icon. A keyword beats an extension, so `deno.json` gets Deno's icon and `tsconfig.json` gets TypeScript's config icon rather than JSON's. A label that matches nothing gets no icon and stays as it is.

Matching works on words, not meaning, so a label can match by accident: `Next steps` gets Next.js's icon. Write `[!none]` before such a label, or turn matching off with the `match` option and name every icon with a marker.

````markdown
% npm or pnpm
> Two keywords: the longer one, `pnpm`, wins.
% Vue + React
> The longer keyword wins even when it comes second.
% VitePress
> A camelCase label: `Vite` is a word of it.
% Next steps
> A false match: `next` is a whole word.
% [!none] Next steps
> Matching turned off for one label.
% Invitations
> No match: `vite` isn't a whole word here.
% [!foo] Install
> No icon is named `foo`, so this isn't a marker.
````

### Built-in icons

| Kind | Keys |
| --- | --- |
| Package managers and runtimes | `npm` `pnpm` `yarn` `bun` `bunx` `deno` |
| Frameworks | `angular` `astro` `ember` `marko` `next` `nuxt` `qwik` `react` `solid` `svelte` `vue` |
| Tools | `esbuild` `eslint` `gradle` `oxc` `oxfmt` `oxlint` `prisma` `rolldown` `rollup` `tailwind` `tailwindcss` `unocss` `vite` `vitest` `vscode` `webpack` |
| Files | `editorconfig` `gitattributes` `gitignore` `tsconfig` `package.json` `uno.config.ts` `.env` |
| Extensions | `.c` `.cjs` `.cpp` `.cs` `.css` `.cts` `.dart` `.gjs` `.go` `.groovy` `.gts` `.html` `.ico` `.ini` `.java` `.js` `.json` `.jsp` `.jsx` `.kt` `.less` `.lua` `.md` `.mjs` `.mts` `.php` `.py` `.r` `.rb` `.rs` `.sass` `.scala` `.scss` `.sln` `.swift` `.toml` `.ts` `.tsx` `.wasm` `.yaml` `.yml` |

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

Powered by [`@mirrordown/mdit-tab-icons`](https://www.npmjs.com/package/@mirrordown/mdit-tab-icons) · Source on [GitHub](https://github.com/mirrordown/mirrordown).
