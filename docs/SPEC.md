# @saeris/markdown — Docs Site Specification

> Reference document for the `docs/` Astro site.
> Covers architecture, content model, layout, and implementation phases.

---

## 1. Goals

The docs site serves two purposes simultaneously:

1. **Usage documentation** — syntax reference, rendered examples, and install instructions for every plugin.
2. **Live validation environment** — rendered plugin output in a real browser, debuggable with devtools, driven by the same `remd-*`/`mdit-*` packages used in production.

The second goal is why content lives in `public/` as raw `.md` files: appending `.md` to any page URL returns the raw source, and VSCode's markdown preview — with the companion extensions installed — renders the file in WYSIWYG fidelity without requiring a dev server.

---

## 2. Architecture

### 2.1 Toolchain

| Concern      | Tool                                                |
| ------------ | --------------------------------------------------- |
| Framework    | Astro (existing scaffold in docs/)                  |
| Build        | `vp exec astro build` via Vite+                     |
| Dev server   | `vp exec astro dev`                                 |
| Styling      | Vanilla CSS, `@layer`, CSS custom properties        |
| JS           | Minimal — progressive enhancement only              |
| Content      | Markdown files in `public/`                         |
| MD rendering | Astro's built-in MD pipeline + our `remd-*` plugins |

The workspace entry is `docs/` (a single workspace package, not a glob). Run all commands from the repo root via `vp run` or from `docs/` directly.

### 2.2 Minimal-JS rule

Default render path uses zero client-side JavaScript. JS is added only when CSS cannot achieve the result:

- **Theme toggle** — one `<script>` in the root layout to read/write `localStorage` and set `data-theme` on `<html>` (progressive enhancement; without JS, `prefers-color-scheme` applies automatically via CSS)
- **Mobile nav toggle** — one `<script>` or a CSS-only `<details>`/`<summary>` approach (to be decided during implementation)
- **Nothing else in the initial scaffold**

### 2.3 Content model

Markdown content lives in `public/plugins/<name>/index.md`. Each file is:

- Served as a raw file at `/plugins/<name>/index.md` — no build step required
- Indexed by Astro's content collections system, which provides typed frontmatter, `getStaticPaths`, and `render()` for the dynamic route
- Importable directly into VSCode's markdown preview for WYSIWYG editing

Each `.md` file imports a shared stylesheet for the preview context:

```markdown
---
title: Plugin Name
---

<style>
  @import url("../../src/styles/markdown.css");
</style>

<!-- content -->
```

The `@import` path is relative so it resolves correctly from `public/plugins/<name>/index.md` back to `src/styles/markdown.css` when opened in VSCode preview. Astro's build does not process these imports — they are VSCode-only.

**Content collections** (Astro 6): a `plugins` collection is defined in `src/content.config.ts` pointing at `public/plugins/`. The collection uses a `z.object` schema to type the frontmatter. The dynamic route calls `getCollection("plugins")` in `getStaticPaths` and `render()` in the page component. This replaces the earlier `fetch`/`Astro.glob` approach and also provides the data source for future search indexing and sidebar generation.

### 2.4 Folder structure

```
docs/
├── public/
│   ├── favicon.svg
│   ├── favicon.ico
│   └── plugins/
│       ├── del/
│       │   └── index.md
│       ├── ins/
│       │   └── index.md
│       └── ...                  # one directory per plugin
├── src/
│   ├── components/
│   │   ├── Header.astro
│   │   ├── Sidebar.astro
│   │   ├── TableOfContents.astro
│   │   ├── Theme.astro           # theme script (localStorage + data-theme)
│   │   └── ThemeSwitcher.astro   # toggle button
│   ├── content.config.ts         # Astro content collections schema
│   ├── layouts/
│   │   ├── Root.astro            # <html>, <head>, theme script slot
│   │   └── Markdown.astro        # shell for any markdown documentation page
│   ├── pages/
│   │   ├── index.astro           # landing / plugin index
│   │   └── plugins/
│   │       └── [...slug].astro   # dynamic route: getStaticPaths from collection
│   └── styles/
│       ├── reset.css
│       ├── theme.css             # CSS custom properties, color-scheme tokens
│       ├── global.css            # base typography, layout primitives
│       └── markdown.css          # prose styles for rendered markdown content
├── astro.config.ts
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 3. Layout

### 3.1 Reference

Primary reference: **Vite+ docs layout** — fixed topnav + left sidebar + main content + right TOC (on this page). Initial scaffold targets desktop; mobile and collapsible sidebar are follow-up passes.

### 3.2 App shell grid

```
┌─────────────────────────────────────────────────────────┐
│ [Logo]  Guide   [Search]                  [Theme][GitHub]│  ← topnav (fixed, ~56px)
├──────────────────┬──────────────────────────┬────────────┤
│                  │                          │            │
│  Sidebar         │   Main content           │  On page   │
│  (collapsible)   │   (prose + examples)     │  (TOC)     │
│                  │                          │            │
│  Plugins         │   # Plugin Name          │  #syntax   │
│  ─────────────   │                          │  #usage    │
│  del             │   Rendered example       │  #install  │
│  ins             │   ────────────────       │            │
│  mark            │   Syntax description     │            │
│  tabs            │   prose...               │            │
│  steps           │                          │            │
│  ...             │                          │            │
│                  │                          │            │
└──────────────────┴──────────────────────────┴────────────┘
```

**Column widths (initial desktop):**

- Sidebar: ~240px, fixed
- Main content: max prose width ~720px, centered in remaining space
- TOC: ~200px, fixed right

### 3.3 Theming

CSS custom properties drive all colors. `color-scheme` and `light-dark()` handle the light/dark split. The `data-theme` attribute on `<html>` lets JS override the OS preference:

```css
:root {
  color-scheme: light dark; /* OS default */
}

[data-theme="light"] {
  color-scheme: light;
}
[data-theme="dark"] {
  color-scheme: dark;
}
```

Token example:

```css
:root {
  --color-bg: light-dark(oklch(0.98 0.005 250), oklch(0.12 0.01 250));
  --color-fg: light-dark(oklch(0.15 0.01 250), oklch(0.92 0.005 250));
  --color-accent: light-dark(oklch(0.55 0.18 250), oklch(0.7 0.18 250));
  --color-border: light-dark(oklch(0.88 0.01 250), oklch(0.25 0.02 250));
  --color-sidebar: light-dark(oklch(0.96 0.005 250), oklch(0.1 0.01 250));
}
```

Theme toggle behavior (JS progressive enhancement, matching guide-to-japanese pattern):

- No JS: `prefers-color-scheme` controls color via `color-scheme: light dark` on `:root`
- With JS: `<Theme>` script fires on load, reads `localStorage`, sets `data-theme` and `color-scheme` inline on `<html>` before first paint (prevents FOUC)
- Toggle cycles: system → dark → light → system
- Persisted in `localStorage` key `"theme"`

---

## 4. Content

### 4.1 Plugin page structure

Each plugin page covers one plugin. The mdit and remd variants are covered on the same page using the `markdown-tabs` plugin to show implementation-specific snippets (install commands, config examples, divergence notes) side-by-side.

Standard page sections:

1. **Header** — plugin name, one-sentence description, badges (npm, JSR, VSCode extension link)
2. **Overview** — what HTML element/structure the plugin produces, and why you'd use it
3. **Syntax** — the markdown syntax, rendered live (this is the primary plugin validation surface)
4. **Usage** — tabbed install + usage code blocks (remd tab / mdit tab)
5. **Options** (if applicable) — options table
6. **Edge cases** — known divergences between remd and mdit, escaping behavior, nesting limits

### 4.2 Plugin inventory (initial pages)

Pages added in order of plugin maturity. Start with plugins that have complete test coverage:

| Page slug                  | Plugin          | Status at scaffold time |
| -------------------------- | --------------- | ----------------------- |
| `/plugins/del`             | del             | Complete                |
| `/plugins/ins`             | ins             | Complete                |
| `/plugins/mark`            | mark            | Complete                |
| `/plugins/kbd`             | kbd             | Complete                |
| `/plugins/sub`             | sub             | Complete                |
| `/plugins/sup`             | sup             | Complete                |
| `/plugins/abbr`            | abbr            | Complete                |
| `/plugins/ruby`            | ruby            | Complete                |
| `/plugins/definition-list` | definition-list | Complete                |
| `/plugins/github-alerts`   | github-alerts   | Complete                |
| `/plugins/attrs`           | attrs           | Complete                |
| `/plugins/unwrap-images`   | unwrap-images   | Complete                |
| `/plugins/tabs`            | tabs            | Complete                |
| `/plugins/steps`           | steps           | Complete                |

### 4.3 Markdown rendering pipeline

**Content collection** (`src/content.config.ts`):

```ts
import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const plugins = defineCollection({
  loader: glob({ pattern: "*/index.md", base: "./public/plugins" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
  }),
});

export const collections = { plugins };
```

**Dynamic route** (`src/pages/plugins/[...slug].astro`):

```ts
import { getCollection, render } from "astro:content";
import Markdown from "../../layouts/Markdown.astro";

export async function getStaticPaths() {
  const entries = await getCollection("plugins");
  return entries.map((entry) => ({
    params: { slug: entry.id },
    props: { entry },
  }));
}

const { entry } = Astro.props;
const { Content, headings } = await render(entry);
```

The page renders `<Content />` inside `Markdown.astro`, passing `headings` to the TOC component.

**`astro.config.ts`** wires in the `remd-*` plugins and sets the `markdown.remarkPlugins` / `rehypePlugins` arrays. The config file uses `defineConfig` from `"astro/config"` — not from `"vite-plus"`. The `vite.config.ts` is separate and handles Vite+ task wrappers (`vp exec astro build`).

```ts
import { defineConfig } from "astro/config";
import { remarkDel } from "@saeris/remd-del";
// ... all remd-* plugins

export default defineConfig({
  markdown: {
    remarkPlugins: [
      remarkDel,
      remarkIns,
      remarkMark,
      // ...
    ],
    rehypePlugins: [
      // rehype-based remd plugins (unwrap-images, inline-svg, etc.)
    ],
  },
});
```

---

## 5. Theme toggle implementation

Follows the guide-to-japanese pattern:

**`src/components/Theme.astro`** — inline `<script type="module">` placed in `<head>` before any content. Reads `localStorage`, resolves theme, writes `data-theme` + `color-scheme` to `<html>` synchronously on load. Listens for `set-theme` custom events, `storage` events (cross-tab sync), and `prefers-color-scheme` changes.

**`src/components/ThemeSwitcher.astro`** — button that dispatches `set-theme` custom events. Cycles system → dark → light → system. Icon display controlled by CSS (`[data-theme="system"] .icon-system { display: block; }` etc.) — no JS reads required for icon state.

---

## 6. Implementation phases

### Phase 6.1 — App shell (current phase)

Goal: a working skeleton with correct layout, theming, and navigation. No real content yet.

1. Update `docs/package.json` — add `@saeris/remd-*` workspace deps, adjust engines to node 24+
2. Update `astro.config.ts` — wire up remd plugins, set `site`
3. Author `src/content.config.ts` — define `plugins` collection with `glob` loader pointing at `public/plugins/`
4. Author `src/styles/` — `reset.css`, `theme.css` (tokens), `global.css`, `markdown.css` (stub)
5. Author `src/layouts/Root.astro` — `<html>`, `<head>`, `<Theme>` script, topnav slot, main slot
6. Author `src/layouts/Markdown.astro` — sidebar + content + TOC three-column shell
7. Author `src/components/` — `Header.astro`, `Sidebar.astro`, `TableOfContents.astro`, `Theme.astro`, `ThemeSwitcher.astro`
8. Author `src/pages/index.astro` — plugin index landing page (list of plugin links)
9. Author `src/pages/plugins/[...slug].astro` — dynamic route via `getCollection("plugins")`
10. Add one stub content file: `public/plugins/del/index.md` — minimal content to validate the pipeline end-to-end
11. Confirm `vp exec astro dev` renders the shell correctly

### Phase 6.2 — Content

For each plugin in the inventory (§4.2):

1. Write `public/plugins/<name>/index.md` — full syntax reference with live examples
2. Confirm VSCode preview renders correctly with the companion extension active
3. Confirm Astro dev server renders identically
4. Note and document any remd/mdit divergences discovered during authoring

### Phase 6.3 — Refinement

After content is complete:

- Collapsible sidebar (desktop focus-mode toggle)
- Mobile layout
- Search (static — Pagefind or similar, no server required)
- Syntax highlighting for code blocks in usage sections
- Prev/next page navigation
- Edit on GitHub links

---

## 7. Open questions (deferred)

- **Syntax highlighting:** Which highlighter for code blocks (Shiki via Astro built-in, or custom)? Deferred to Phase 6.3.
- **Search:** Pagefind is the natural choice for a static Astro site; confirm it works with our `vp exec astro build` pipeline before committing.
- **Header sections plugin:** `mdit-header-sections` / `remd-header-sections` are not yet in the monorepo. The docs site does not depend on them but they may be useful for auto-TOC extraction.
- **Plugin-specific CSS in `public/`:** If any plugin page needs styles beyond `markdown.css`, revisit the co-location pattern. No instances identified yet.
- **`inline-svg` behavior skew:** Known divergence between remd and mdit implementations. Document it on the `inline-svg` plugin page rather than resolving it upfront.
