# @mirrordown/sat-github-alerts

> Part of [Mirrordown](https://github.com/mirrordown/mirrordown) — a suite of markdown syntax extensions for the unified, markdown-it and Sätteri ecosystems.

A Sätteri plugin for the `github-alerts` syntax extension.

## Overview

The `github-alerts` plugin converts GitHub-style alert blockquotes (`> [!NOTE]`, `> [!WARNING]`, etc.) into styled `<div>` containers with an icon and title. Foldable alerts are rendered as `<details>` elements.

```html
<div class="markdown-alert" data-alert="note">
  <p class="markdown-alert-title">Note</p>
  <p>...</p>
</div>
```

## Syntax

Write a blockquote with a `[!TYPE]` marker on the first line:

````markdown
> [!NOTE]
> Useful information that users should know, even if skimming.

> [!TIP]
> Helpful advice for getting things done more effectively.

> [!IMPORTANT]
> Key information users need to know to achieve their goal.

> [!WARNING]
> Urgent info that needs immediate user attention to avoid problems.

> [!CAUTION]
> Advises about risks or negative outcomes of certain actions.
````

### Custom titles

Override the default title by adding text after the type marker. Everything after the marker on that line is the title, and it can use inline formatting; the body starts on the next line:

````markdown
> [!NOTE] Custom *Title*
> This alert uses a custom title instead of the default.
````

### Foldable alerts

Use `+` to make an alert open by default, or `-` to make it collapsed by default:

````markdown
> [!TIP]+
> This tip is open by default.

> [!WARNING]-
> This warning is collapsed by default.
````

## Configuration

All options are passed when registering the plugin.

### Disable icons

Set `icons: false` to suppress the SVG icon from every alert title:

````markdown
> [!NOTE]
> This note has no icon.

> [!WARNING]
> This warning has no icon.
````

```ts
satteriGithubAlerts({ icons: false })
```

### Override default titles

Supply a `titles` map to replace the default heading text for any built-in type:

````markdown
> [!TIP]
> This is a pro tip.
````

```ts
satteriGithubAlerts({ titles: { tip: "Pro tip" } })
```

### Add custom alert types

Register new keywords with `types`. The value is the canonical type name that appears in the `data-alert` attribute and determines which CSS variable set applies. Style the new type with your own CSS:

```ts
satteriGithubAlerts({
  types: { release: "release", changelog: "release" },
  titles: { release: "Release notes" },
})
```
```css
[data-alert="release"] {
  --markdown-alert-color: oklch(0.55 0.18 300);
}
```

## Install

```sh
npm install @mirrordown/sat-github-alerts
```

### Standalone

```ts
import { markdownToHtml } from "satteri";
import { satteriGithubAlerts } from "@mirrordown/sat-github-alerts";

const { html } = markdownToHtml(source, {
  mdastPlugins: [satteriGithubAlerts()],
});
```

### Astro

```ts
// astro.config.ts
import { defineConfig } from "astro/config";
import { satteri } from "@astrojs/markdown-satteri";
import { satteriGithubAlerts } from "@mirrordown/sat-github-alerts";

export default defineConfig({
  markdown: {
    processor: satteri({ mdastPlugins: [satteriGithubAlerts()] }),
  },
});
```

## Documentation

Full documentation, more examples, and configuration options: [github.com/mirrordown/mirrordown](https://github.com/mirrordown/mirrordown) (dedicated docs site coming soon).

## License

MIT © [Drake Costa](https://saeris.gg)
