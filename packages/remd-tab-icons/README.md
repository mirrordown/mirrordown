# @mirrordown/remd-tab-icons

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified, markdown-it and Sätteri ecosystems.

A remark/rehype (unified) plugin for the `tab-icons` syntax extension.

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

## Configuration

All options are passed when registering the plugin.

### Add or replace icons

`icons` maps keys to SVG markup. A key with a `.` is matched as a file name or extension, any other key as a keyword, and a key that is also built in replaces that icon. Your file names and extensions are tried before the built-in ones, so `.vitepress` matches `.vitepress/config.ts` before `.ts` does. Icons from [Iconify](https://icon-sets.iconify.design/) work well: copy an icon's SVG.

```ts
rehypeTabIcons({
  icons: {
    docker: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">...</svg>`,
  },
})
```

An icon drawn for one background can take a `{ light, dark }` pair instead: both render, and the stylesheet shows the one for the color scheme.

```ts
icons: {
  ".vitepress": {
    light: `<svg ...>...</svg>`,
    dark: `<svg ...>...</svg>`,
  },
}
```

### Other options

| Option | Default | |
| --- | --- | --- |
| `builtin` | `true` | `false` leaves out the built-in icons, so only yours match. |
| `match` | `true` | `false` turns matching off: only labels with a marker get an icon. |
| `containerClass` | `"markdown-tabs"` | The tab groups' class, if you changed the tabs plugin's. |

## Accessibility

The icon is `aria-hidden`: the label's text names the tab, and the icon only decorates it. The marker comes out of the label and out of its panel's `aria-label`, so a screen reader reads `Install`, not `[!npm] Install`.

## Customization

The stylesheet keeps its rules in `@layer markdown-tab-icons`, so any unlayered CSS you write overrides them. An icon fills a square as tall as the label's capital letters (`1cap`), with its drawing fitted inside, so it scales with the label's font.

```css
.markdown-tab-icon {
  inline-size: 1.2cap;
  block-size: 1.2cap;
}
```

Icons with light and dark variants follow the reader's preferred color scheme. A site with its own theme switch can show them by it instead, with unlayered rules:

```css
:root[data-theme="light"] .markdown-tab-icon[data-scheme="light"],
:root[data-theme="dark"] .markdown-tab-icon[data-scheme="dark"] {
  display: revert;
}

:root[data-theme="light"] .markdown-tab-icon[data-scheme="dark"],
:root[data-theme="dark"] .markdown-tab-icon[data-scheme="light"] {
  display: none;
}
```

The plugin decorates the tab groups that the [tabs](/guide/plugins/tabs) plugin builds, so install that too.

## Install

The remark package ships `rehypeTabIcons`, a rehype plugin: register it after `remark-rehype`, with the tabs plugin's handlers. It adds each `<svg>` as a `raw` node, so it reaches the HTML exactly as the other engines write it; stringify with `allowDangerousHtml: true` (Astro already does).

```sh
npm install @mirrordown/remd-tab-icons
```

### Unified

```ts
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { remarkTabs, tabsHastHandlers } from "@mirrordown/remd-tabs";
import { rehypeTabIcons } from "@mirrordown/remd-tab-icons";
import "@mirrordown/remd-tabs/tabs.css";
import "@mirrordown/remd-tab-icons/tab-icons.css";

const processor = unified()
  .use(remarkParse)
  .use(remarkTabs)
  .use(remarkRehype, { handlers: tabsHastHandlers })
  .use(rehypeTabIcons)
  .use(rehypeStringify, { allowDangerousHtml: true });
```

### Astro

```ts
// astro.config.ts
import { defineConfig } from "astro/config";
import { remarkTabs, tabsHastHandlers } from "@mirrordown/remd-tabs";
import { rehypeTabIcons } from "@mirrordown/remd-tab-icons";

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkTabs],
    remarkRehype: { handlers: tabsHastHandlers },
    rehypePlugins: [rehypeTabIcons],
  },
});

// In your layout:
import "@mirrordown/remd-tabs/tabs.css";
import "@mirrordown/remd-tab-icons/tab-icons.css";
```

## Documentation

Full documentation, more examples, and configuration options: [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown) (dedicated docs site coming soon).

## License

MIT © [Drake Costa](https://saeris.gg)
